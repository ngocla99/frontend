import { NextResponse } from "next/server";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/matches/celebrity - Get celebrity lookalike matches for current user
 *
 * Query params:
 *   - face_id: Optional face ID to get matches for (defaults to default_face_id)
 *   - limit: Number of results (default: 20)
 *   - category: Filter by celebrity category (optional)
 *
 * Returns:
 *   - matches: Array of celebrity matches with signed image URLs
 *   - total: Total number of matches
 *
 * Example response:
 * {
 *   "matches": [
 *     {
 *       "id": "uuid",
 *       "similarity_score": 0.85,
 *       "created_at": "2025-11-01T...",
 *       "celebrity": {
 *         "id": "uuid",
 *         "name": "Taylor Swift",
 *         "bio": "Grammy-winning singer-songwriter",
 *         "category": "musicians",
 *         "gender": "female",
 *         "image_url": "https://..."
 *       }
 *     }
 *   ],
 *   "total": 15
 * }
 */
export const GET = withSession(async ({ session, searchParams, supabase }) => {
	const faceId = searchParams.face_id;
	const limit = parseInt(searchParams.limit || "20", 10);
	const category = searchParams.category;

	// Get user's default face if not specified
	let targetFaceId = faceId;
	if (!targetFaceId) {
		const { data: profile } = await supabase
			.from("profiles")
			.select("default_face_id")
			.eq("id", session.user.id)
			.single();

		targetFaceId = profile?.default_face_id;
	}

	if (!targetFaceId) {
		return NextResponse.json(
			{ error: "No face found for user. Please upload a photo first." },
			{ status: 404 },
		);
	}

	// Build query for celebrity matches from new celebrity_matches table
	const query = supabase
		.from("celebrity_matches")
		.select(
			`
      id,
      similarity_score,
      created_at,
      celebrity:celebrities!celebrity_matches_celebrity_id_fkey (
        id,
        name,
        bio,
        category,
        gender,
        image_path
      )
    `,
		)
		.eq("face_id", targetFaceId)
		.order("similarity_score", { ascending: false })
		.limit(limit);

	// Apply category filter if provided
	if (category) {
		// Note: Filtering on nested celebrity.category requires special handling
		// We'll fetch all and filter in-memory for now, or use a database view
		// For better performance, consider creating a materialized view
	}

	const { data: matches, error } = await query;

	if (error) {
		console.error("Error fetching celebrity matches:", error);
		throw error;
	}

	// Filter by category in-memory if needed
	let filteredMatches = matches || [];
	if (category) {
		filteredMatches = filteredMatches.filter(
			(match: any) => match.celebrity?.category === category,
		);
	}

	// Get public URLs for celebrity images (bucket is public)
	const matchesWithSignedUrls = filteredMatches.map((match: any) => {
		const celebrity = match.celebrity;

		if (!celebrity || !celebrity.image_path) {
			return {
				id: match.id,
				similarity_score: match.similarity_score,
				created_at: match.created_at,
				celebrity: null,
			};
		}

		const { data: publicUrlData } = supabase.storage
			.from(STORAGE_BUCKETS.CELEBRITY_IMAGES)
			.getPublicUrl(celebrity.image_path);

		return {
			id: match.id,
			similarity_score: match.similarity_score,
			created_at: match.created_at,
			celebrity: {
				id: celebrity.id,
				name: celebrity.name,
				bio: celebrity.bio,
				category: celebrity.category,
				gender: celebrity.gender,
				image_url: publicUrlData.publicUrl,
			},
		};
	});

	return NextResponse.json({
		matches: matchesWithSignedUrls,
		total: matchesWithSignedUrls.length,
	});
});
