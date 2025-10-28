import { type NextRequest, NextResponse } from "next/server";
import { findCelebrityMatches } from "@/lib/db/vector";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";

/**
 * POST /api/matches/celebrity - Find celebrity lookalikes
 *
 * Uses vector similarity search to find celebrity faces
 * that match the provided face.
 *
 * Request body:
 *   - face_id: UUID of the face to match (optional if user_id provided)
 *   - user_id: UUID of user (uses default face)
 *   - limit: Number of matches (default: 10)
 */
export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { face_id, user_id, limit = 10 } = body;

		let faceIdToUse = face_id;

		// If user_id provided, get their default face
		if (!faceIdToUse && user_id) {
			const { data: profile } = await supabase
				.from("profiles")
				.select("default_face_id")
				.eq("id", user_id)
				.single();

			if (!profile?.default_face_id) {
				return NextResponse.json(
					{ error: "User has no default face" },
					{ status: 400 },
				);
			}

			faceIdToUse = profile.default_face_id;
		}

		// If no face specified, use current user's default face
		if (!faceIdToUse) {
			const { data: profile } = await supabase
				.from("profiles")
				.select("default_face_id")
				.eq("id", user.id)
				.single();

			if (!profile?.default_face_id) {
				return NextResponse.json(
					{ error: "You need to upload a face first" },
					{ status: 400 },
				);
			}

			faceIdToUse = profile.default_face_id;
		}

		// Get face embedding
		const { data: face, error: faceError } = await supabase
			.from("faces")
			.select("id, embedding, image_path, profile_id")
			.eq("id", faceIdToUse)
			.single();

		if (faceError || !face || !face.embedding) {
			return NextResponse.json(
				{ error: "Face embedding not found" },
				{ status: 404 },
			);
		}

		// Find celebrity matches using pgvector
		const celebrities = await findCelebrityMatches(face.embedding, limit);

		// Get signed URLs for celebrity images
		const celebritiesWithUrls = await Promise.all(
			celebrities.map(async (celeb) => {
				const { data: imageUrl } = await supabase.storage
					.from(STORAGE_BUCKETS.USER_IMAGES)
					.createSignedUrl(celeb.image_path, 3600);

				return {
					celebrity_id: celeb.face_id,
					celebrity_name: celeb.celebrity_name,
					similarity_score: celeb.similarity,
					image_url: imageUrl?.signedUrl,
				};
			}),
		);

		// Get user face image URL
		const { data: userImageUrl } = await supabase.storage
			.from(STORAGE_BUCKETS.USER_IMAGES)
			.createSignedUrl(face.image_path, 3600);

		return NextResponse.json({
			user_face: {
				id: face.id,
				profile_id: face.profile_id,
				image_url: userImageUrl?.signedUrl,
			},
			celebrities: celebritiesWithUrls,
			total: celebritiesWithUrls.length,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
