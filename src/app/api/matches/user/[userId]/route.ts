import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { findSimilarFaces } from "@/lib/db/vector";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/matches/user/[userId] - Find matches for a specific user
 *
 * Uses vector similarity search to find similar faces.
 *
 * Query params:
 *   - limit: Number of matches (default: 20)
 *   - threshold: Similarity threshold 0-1 (default: 0.5)
 */
export const GET = withSession(async ({ params, searchParams, supabase }) => {
	const userId = params.userId;
	const limit = parseInt(searchParams.limit || "20", 10);
	const threshold = parseFloat(searchParams.threshold || "0.5");

	// Get target user's default face
	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("id, name, default_face_id, gender, school")
		.eq("id", userId)
		.single();

	if (profileError || !profile) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	if (!profile.default_face_id) {
		return NextResponse.json(
			{ error: "User has no face uploaded" },
			{ status: 400 },
		);
	}

	// Get face embedding
	const { data: face, error: faceError } = await supabase
		.from("faces")
		.select("id, embedding, image_path")
		.eq("id", profile.default_face_id)
		.single();

	if (faceError || !face || !face.embedding) {
		return NextResponse.json(
			{ error: "Face embedding not found" },
			{ status: 404 },
		);
	}

	// Find similar faces using pgvector
	const similarFaces = await findSimilarFaces(face.embedding, {
		threshold,
		limit,
		excludeProfileId: userId,
	});

	// Get signed URLs for all images
	const matchesWithUrls = await Promise.all(
		similarFaces.map(async (match) => {
			const { data: matchImageUrl } = await supabase.storage
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(match.image_path, env.SUPABASE_SIGNED_URL_TTL);

			const { data: userImageUrl } = await supabase.storage
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(face.image_path, env.SUPABASE_SIGNED_URL_TTL);

			return {
				match_id: null, // New match, not saved yet
				similarity_score: match.similarity,
				user_face: {
					id: face.id,
					profile_id: profile.id,
					name: profile.name,
					image_url: userImageUrl?.signedUrl,
					gender: profile.gender,
					school: profile.school,
				},
				match_face: {
					id: match.face_id,
					profile_id: match.profile_id,
					name: match.profile_name,
					profile_type: match.profile_type,
					image_url: matchImageUrl?.signedUrl,
				},
			};
		}),
	);

	return NextResponse.json({
		user: {
			id: profile.id,
			name: profile.name,
		},
		matches: matchesWithUrls,
		total: matchesWithUrls.length,
	});
});
