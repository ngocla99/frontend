import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";
import { lookupUniversityByEmail } from "@/lib/services/university-lookup";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/me - Get current authenticated user profile
 *
 * Profile is automatically created via database trigger when user signs up.
 */
export async function GET(_request: NextRequest) {
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

		// Fetch profile and face in parallel
		const [profileResult, faceResult] = await Promise.all([
			// Get user profile
			supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.single(),
			// Get default face image (we'll filter later)
			supabase
				.from("faces")
				.select("image_path, id")
				.eq("profile_id", user.id)
				.order("created_at", { ascending: false })
				.limit(10), // Get multiple faces in case we need to find default
		]);

		const { data: profile, error: profileError } = profileResult;
		const { data: faces } = faceResult;

		// Profile should exist due to trigger, but handle edge case
		if (profileError || !profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Get default face image if exists
		let defaultFaceImage = null;
		if (profile.default_face_id && faces && faces.length > 0) {
			const face = faces.find((f) => f.id === profile.default_face_id);

			if (face) {
				const { data: signedUrl } = await supabase.storage
					.from(STORAGE_BUCKETS.USER_IMAGES)
					.createSignedUrl(face.image_path, env.SUPABASE_SIGNED_URL_TTL);

				defaultFaceImage = signedUrl?.signedUrl || null;
			}
		}

		// Return user profile
		return NextResponse.json({
			id: profile.id,
			name: profile.name,
			email: profile.email,
			gender: profile.gender,
			school: profile.school,
			default_face_id: profile.default_face_id,
			image: defaultFaceImage,
		});
	} catch (error) {
		return handleApiError(error);
	}
}

/**
 * PATCH /api/auth/me - Update current user profile
 */
export const PATCH = withSession(async ({ request, session, supabase }) => {
	const body = await request.json();

	// Validate and sanitize input
	const updates: any = {};
	if (body.name !== undefined) updates.name = body.name;
	if (body.gender !== undefined) updates.gender = body.gender;
	if (body.school !== undefined) updates.school = body.school;
	if (body.default_face_id !== undefined)
		updates.default_face_id = body.default_face_id;

	// Auto-fill school if not provided in request body
	// session.profile is already fetched by withSession middleware
	if (
		body.school === undefined &&
		!session.profile.school &&
		session.user.email
	) {
		const detectedSchool = await lookupUniversityByEmail(session.user.email);
		if (detectedSchool) {
			updates.school = detectedSchool;
		}
		if (env.DEV_ALLOW_NON_EDU_EMAILS) {
			updates.school = "Columbia University";
		}
	}

	// Update profile
	const { data, error } = await supabase
		.from("profiles")
		.update({
			...updates,
			updated_at: new Date().toISOString(),
		})
		.eq("id", session.user.id)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update profile: ${error.message}`);
	}

	return NextResponse.json(data);
});
