import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/matches/top - Get all user-user matches (live feed)
 *
 * Returns ALL recent user-user matches sorted by creation date.
 * Used for the public live match feed on the homepage.
 * Only shows matches between users (not celebrity matches).
 *
 * Query params:
 *   - limit: Number of matches to return (default: 20, max: 100)
 *   - skip: Number of matches to skip for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient();
		const { searchParams } = new URL(request.url);
		const limit = Math.min(
			parseInt(searchParams.get("limit") || "20", 10),
			100,
		);
		const skip = parseInt(searchParams.get("skip") || "0", 10);

		// Get recent user-user matches with profile and face data
		// Filter for matches where both profiles are users (not celebrities)
		const { data: matches, error } = await supabase
			.from("matches")
			.select(
				`
        id,
        similarity_score,
        created_at,
        face_a:faces!matches_face_a_id_fkey (
          id,
          image_path,
          profile:profiles!faces_profile_id_fkey (
            id,
            name,
            profile_type,
            gender,
            school
          )
        ),
        face_b:faces!matches_face_b_id_fkey (
          id,
          image_path,
          profile:profiles!faces_profile_id_fkey (
            id,
            name,
            profile_type,
            gender,
            school
          )
        )
      `,
			)
			.not("face_a.profile_id", "is", null)
			.not("face_b.profile_id", "is", null)
			.order("created_at", { ascending: false })
			.range(skip, skip + limit - 1);

		if (error) {
			throw error;
		}

		// Filter out any matches where profile data is still null (extra safety)
		const validMatches = (matches || []).filter(
			(match) => match.face_a?.profile && match.face_b?.profile,
		);

		// Generate signed URLs for images
		const matchesWithUrls = await Promise.all(
			validMatches.map(async (match) => {
				const [urlA, urlB] = await Promise.all([
					supabase.storage
						.from("user-images")
						.createSignedUrl(match.face_a.image_path, 3600),
					supabase.storage
						.from("user-images")
						.createSignedUrl(match.face_b.image_path, 3600),
				]);

				// Get public URLs as fallback if signed URLs fail
				const imageUrlA =
					urlA.data?.signedUrl ||
					supabase.storage
						.from("user-images")
						.getPublicUrl(match.face_a.image_path).data.publicUrl;
				const imageUrlB =
					urlB.data?.signedUrl ||
					supabase.storage
						.from("user-images")
						.getPublicUrl(match.face_b.image_path).data.publicUrl;

				return {
					id: match.id,
					similarity_score: match.similarity_score,
					created_at: match.created_at,
					users: {
						a: {
							id: match.face_a.profile.id,
							name: match.face_a.profile.name,
							profile_type: match.face_a.profile.profile_type,
							gender: match.face_a.profile.gender,
							school: match.face_a.profile.school,
							face_id: match.face_a.id,
							image: imageUrlA,
						},
						b: {
							id: match.face_b.profile.id,
							name: match.face_b.profile.name,
							profile_type: match.face_b.profile.profile_type,
							gender: match.face_b.profile.gender,
							school: match.face_b.profile.school,
							face_id: match.face_b.id,
							image: imageUrlB,
						},
					},
				};
			}),
		);

		return NextResponse.json({
			matches: matchesWithUrls,
			total: matchesWithUrls.length,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
