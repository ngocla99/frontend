import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/matches/for-image - Get all saved matches for a specific user face
 *
 * Queries the matches table directly (NOT vector search) to get historical match data.
 * Supports filtering by match type (user/celebrity) and groups matches by unique user pairs.
 *
 * Query params:
 *   - face_id (required): UUID of the user's face to fetch matches for
 *   - match_type (optional): Filter by "user" (university), "celebrity", or "all" (default: "all")
 *   - limit (optional): Number of matches to return (default: 50)
 *   - skip (optional): Pagination offset (default: 0)
 */
export const GET = withSession(async ({ searchParams, supabase, session }) => {
	const faceId = searchParams.face_id;
	const matchType = searchParams.match_type || "all";
	const limit = parseInt(searchParams.limit || "50", 10);
	const skip = parseInt(searchParams.skip || "0", 10);

	// Validate required parameters
	if (!faceId) {
		return NextResponse.json({ error: "face_id is required" }, { status: 400 });
	}

	if (!["user", "celebrity", "all"].includes(matchType)) {
		return NextResponse.json(
			{ error: 'match_type must be "user", "celebrity", or "all"' },
			{ status: 400 },
		);
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

	// Build query with match_type filter
	let query = supabase
		.from("matches")
		.select(
			`
      id,
      similarity_score,
      created_at,
      face_a_id,
      face_b_id,
      match_type,
      face_a:faces!matches_face_a_id_fkey (
        id,
        image_path,
        profile_id,
        profile:profiles!faces_profile_id_fkey (
          id,
          name,
          gender,
          school,
          profile_type
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
          school,
          profile_type
        )
      )
    `,
		)
		.or(`face_a_id.eq.${faceId},face_b_id.eq.${faceId}`);

	// Apply match_type filter for better performance (uses index)
	if (matchType === "user") {
		query = query.eq("match_type", "user_to_user");
	} else if (matchType === "celebrity") {
		query = query.eq("match_type", "user_to_celebrity");
	}
	// If matchType === "all", don't add filter (fetch all types)

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

		// Note: match_type filtering is now done at database level for better performance
		// No need to filter again here

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
				type:
					otherProfile.profile_type === "celebrity"
						? "user-celebrity"
						: "user-user",
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
			similarity_percentage: Math.round((1 - match.similarity_score) * 100), // Convert to percentage
			reactions: {}, // TODO: Join reactions table when implemented
		});
	}

	// Convert Map to Array
	const allMatches = Array.from(groupedMatches.values());

	// For celebrity matches, flatten to individual matches (no grouping)
	// For user matches, keep grouped format
	let finalMatches;
	if (matchType === "celebrity") {
		// Flatten: each individual match becomes a separate entry
		finalMatches = allMatches.flatMap((group) =>
			group.matches.map((match: any) => ({
				id: match.id,
				created_at: match.created_at,
				celeb: {
					id: group.other.id,
					name: group.other.name,
					image_url: match.other_image,
					gender: group.other.gender,
					school: group.other.school,
				},
				me: {
					id: group.me.id,
					name: group.me.name,
					image: match.my_image,
					gender: group.me.gender,
					school: group.me.school,
				},
				my_reaction: [],
				reactions: match.reactions,
				similarity_score: match.similarity_score, // Distance value (for backward compatibility)
				similarity_percentage: match.similarity_percentage, // Percentage value
				type: "user-celebrity" as const,
			})),
		);
	} else {
		// Keep grouped format for user matches
		finalMatches = allMatches;
	}

	// Apply pagination
	const paginatedMatches = finalMatches.slice(skip, skip + limit);

	return NextResponse.json({
		matches: paginatedMatches,
		total: finalMatches.length,
	});
});
