import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { withSession } from "@/lib/middleware/with-session";
import { calculateMatchPercentage } from "@/lib/utils/match-percentage";

/**
 * GET /api/matches/for-image - Get all saved user matches for a specific user face
 *
 * Queries the matches table directly (NOT vector search) to get historical match data.
 * Groups matches by unique user pairs.
 *
 * Query params:
 *   - face_id (required): UUID of the user's face to fetch matches for
 *   - limit (optional): Number of matches to return (default: 50)
 *   - skip (optional): Pagination offset (default: 0)
 */
export const GET = withSession(async ({ searchParams, supabase, session }) => {
	const faceId = searchParams.face_id;
	const limit = parseInt(searchParams.limit || "50", 10);
	const skip = parseInt(searchParams.skip || "0", 10);

	// Validate required parameters
	if (!faceId) {
		return NextResponse.json({ error: "face_id is required" }, { status: 400 });
	}

	// Get the face and its profile
	const { data: myFace, error: myFaceError } = await supabase
		.from("faces")
		.select(
			`
			id,
			image_path,
			profile_id,
			profile:profiles!faces_profile_id_fkey (
				id,
				name,
				gender,
				school
			)
			`,
		)
		.eq("id", faceId)
		.single();

	if (myFaceError || !myFace) {
		return NextResponse.json({ error: "Face not found" }, { status: 404 });
	}

	// Verify the face belongs to the current user
	if (myFace.profile_id !== session.profile.id) {
		return NextResponse.json(
			{ error: "Unauthorized: Face does not belong to current user" },
			{ status: 403 },
		);
	}

	// Build query for user matches
	const query = supabase
		.from("matches")
		.select(
			`
      id,
      similarity_score,
      created_at,
      face_a_id,
      face_b_id,
      face_a:faces!matches_face_a_id_fkey (
        id,
        image_path,
        profile_id,
        profile:profiles!faces_profile_id_fkey (
          id,
          name,
          gender,
          school
        )
      ),
      face_b:faces!matches_face_b_id_fkey (
        id,
        image_path,
        profile_id,
        profile:profiles!faces_profile_id_fkey (
          id,
          name,
          gender,
          school
        )
      )
    `,
		)
		.or(`face_a_id.eq.${faceId},face_b_id.eq.${faceId}`);

	const { data: matchRecords, error: matchError } = await query.order(
		"created_at",
		{ ascending: false },
	);

	if (matchError) {
		console.error("Error querying matches:", matchError);
		return NextResponse.json(
			{ error: "Failed to fetch matches" },
			{ status: 500 },
		);
	}

	if (!matchRecords || matchRecords.length === 0) {
		return NextResponse.json({
			matches: [],
			total: 0,
		});
	}

	// Group matches by unique user pairs
	const groupedMatches = new Map();

	for (const match of matchRecords) {
		// Determine which side is "me" vs "other"
		const isUserA = match.face_a_id === faceId;
		const myFaceData = (isUserA ? match.face_a : match.face_b) as any;
		const otherFaceData = (isUserA ? match.face_b : match.face_a) as any;

		const otherProfile = otherFaceData?.profile;

		// Skip if profile data is missing
		if (!otherProfile || !myFaceData?.profile) {
			console.warn(`Skipping match ${match.id}: Missing profile data`);
			continue;
		}

		// Note: All matches in this table are user-to-user matches now

		// Group by other user's profile_id
		const key = otherProfile.id;

		if (!groupedMatches.has(key)) {
			// Get profile data, handling both array and object cases
			const myProfile = Array.isArray(myFaceData.profile)
				? myFaceData.profile[0]
				: myFaceData.profile;

			// Get signed URL for other user's image (use their default face or first match face)
			const { data: otherImageUrl } = await supabase.storage
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(otherFaceData.image_path, env.SUPABASE_SIGNED_URL_TTL);

			// Get signed URL for my image
			const { data: myImageUrl } = await supabase.storage
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(myFaceData.image_path, env.SUPABASE_SIGNED_URL_TTL);

			groupedMatches.set(key, {
				me: {
					id: myProfile.id,
					name: myProfile.name,
					gender: myProfile.gender,
					image: myImageUrl?.signedUrl || "",
					school: myProfile.school,
				},
				other: {
					id: otherProfile.id,
					name: otherProfile.name,
					gender: otherProfile.gender,
					image: otherImageUrl?.signedUrl || "",
					school: otherProfile.school,
				},
				number_of_matches: 0,
				type: "user-user",
				matches: [],
			});
		}

		// Get signed URLs for this specific match's images
		const { data: myMatchImageUrl } = await supabase.storage
			.from(STORAGE_BUCKETS.USER_IMAGES)
			.createSignedUrl(myFaceData.image_path, env.SUPABASE_SIGNED_URL_TTL);

		const { data: otherMatchImageUrl } = await supabase.storage
			.from(STORAGE_BUCKETS.USER_IMAGES)
			.createSignedUrl(otherFaceData.image_path, env.SUPABASE_SIGNED_URL_TTL);

		// Add this match to the group
		const group = groupedMatches.get(key);
		group.number_of_matches++;
		group.matches.push({
			id: match.id,
			created_at: match.created_at,
			my_image: myMatchImageUrl?.signedUrl || "",
			other_image: otherMatchImageUrl?.signedUrl || "",
			similarity_score: match.similarity_score, // Distance value (for backward compatibility)
			similarity_percentage: calculateMatchPercentage(match.similarity_score), // Engaging exponential formula
			reactions: {}, // TODO: Join reactions table when implemented
		});
	}

	// Convert Map to Array and keep grouped format for user matches
	const finalMatches = Array.from(groupedMatches.values());

	// Apply pagination
	const paginatedMatches = finalMatches.slice(skip, skip + limit);

	return NextResponse.json({
		matches: paginatedMatches,
		total: finalMatches.length,
	});
});
