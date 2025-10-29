/**
 * Vector similarity search helpers using Supabase Vector (pgvector)
 *
 * This module provides TypeScript interfaces for working with face embeddings
 * and performing similarity searches using pgvector's HNSW index.
 */

import { createClient } from "@/lib/supabase/server";

export interface SimilarFace {
	face_id: string;
	profile_id: string;
	similarity: number;
	image_path: string;
	profile_name: string;
	profile_type: "user" | "celebrity";
}

export interface CelebrityMatch {
	face_id: string;
	celebrity_name: string;
	similarity: number;
	image_path: string;
}

/**
 * Find similar faces using pgvector cosine similarity
 *
 * @param embedding - 512-dimensional face embedding from InsightFace
 * @param options - Search options
 * @returns Array of similar faces sorted by similarity (descending)
 *
 * @example
 * ```typescript
 * const similar = await findSimilarFaces(userEmbedding, {
 *   threshold: 0.7,
 *   limit: 10,
 *   excludeProfileId: currentUserId
 * });
 * ```
 */
export async function findSimilarFaces(
	embedding: number[],
	options: {
		threshold?: number;
		limit?: number;
		excludeProfileId?: string;
	} = {},
): Promise<SimilarFace[]> {
	const { threshold = 0.5, limit = 20, excludeProfileId } = options;

	const supabase = await createClient();

	const { data, error } = await supabase.rpc("find_similar_faces", {
		query_embedding: embedding,
		match_threshold: threshold,
		match_count: limit,
		exclude_profile_id: excludeProfileId || null,
	});

	if (error) {
		console.error("Vector search error:", error);
		throw new Error(`Failed to find similar faces: ${error.message}`);
	}

	return data as SimilarFace[];
}

/**
 * Find celebrity lookalikes for a given face embedding
 *
 * @param embedding - 512-dimensional face embedding from InsightFace
 * @param limit - Maximum number of matches to return (default: 10)
 * @returns Array of celebrity matches sorted by similarity (descending)
 *
 * @example
 * ```typescript
 * const celebrities = await findCelebrityMatches(userEmbedding, 5);
 * console.log(`You look like ${celebrities[0].celebrity_name}!`);
 * ```
 */
export async function findCelebrityMatches(
	embedding: number[],
	limit: number = 10,
): Promise<CelebrityMatch[]> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("find_celebrity_matches", {
		query_embedding: embedding,
		match_count: limit,
	});

	if (error) {
		console.error("Celebrity search error:", error);
		throw new Error(`Failed to find celebrity matches: ${error.message}`);
	}

	return data as CelebrityMatch[];
}

/**
 * Insert or update face embedding in database
 *
 * @param faceId - UUID of the face record
 * @param embedding - 512-dimensional face embedding
 *
 * @example
 * ```typescript
 * const embedding = await extractEmbeddingFromImage(imageBuffer);
 * await upsertFaceEmbedding(faceId, embedding);
 * ```
 */
export async function upsertFaceEmbedding(
	faceId: string,
	embedding: number[],
): Promise<void> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("faces")
		.update({ embedding })
		.eq("id", faceId);

	if (error) {
		throw new Error(`Failed to update embedding: ${error.message}`);
	}
}

/**
 * Distance metrics used in pgvector
 *
 * - Cosine Distance (<=>): 1 - cosine_similarity (0 = identical, 2 = opposite)
 * - Euclidean Distance (<->): L2 distance
 * - Inner Product (<#>): Dot product
 *
 * For InsightFace embeddings (L2-normalized), cosine distance is recommended.
 */
export const VECTOR_DISTANCE_METRICS = {
	COSINE: "<=>",
	EUCLIDEAN: "<->",
	INNER_PRODUCT: "<#>",
} as const;

/**
 * Recommended similarity thresholds for face matching
 *
 * These values are empirically determined for InsightFace embeddings:
 * - HIGH: Very strict matching (likely same person)
 * - MEDIUM: Moderate matching (strong resemblance)
 * - LOW: Loose matching (some resemblance)
 */
export const SIMILARITY_THRESHOLDS = {
	HIGH: 0.8, // > 80% similarity
	MEDIUM: 0.65, // > 65% similarity
	LOW: 0.5, // > 50% similarity
} as const;
