import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/me - Get current authenticated user profile
 */
export async function GET(_request: NextRequest) {
	try {
		const supabase = await createClient();

		// Get authenticated user from cookies
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user profile
		let { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		// If profile doesn't exist, create it
		if (profileError || !profile) {
			const { data: newProfile, error: createError } = await supabase
				.from("profiles")
				.insert({
					id: user.id,
					email: user.email,
					profile_type: "user",
				})
				.select()
				.single();

			if (createError || !newProfile) {
				return NextResponse.json(
					{ error: "Failed to create profile" },
					{ status: 500 },
				);
			}

			profile = newProfile;
		}

		// Get default face image if exists
		let defaultFaceImage = null;
		if (profile.default_face_id) {
			const { data: face } = await supabase
				.from("faces")
				.select("image_path")
				.eq("id", profile.default_face_id)
				.single();

			if (face) {
				const { data: signedUrl } = await supabase.storage
					.from("faces")
					.createSignedUrl(face.image_path, 3600);

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
export async function PATCH(request: NextRequest) {
	try {
		const supabase = await createClient();

		// Get authenticated user from cookies
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validate and sanitize input
		const updates: any = {};
		if (body.name !== undefined) updates.name = body.name;
		if (body.gender !== undefined) updates.gender = body.gender;
		if (body.school !== undefined) updates.school = body.school;
		if (body.default_face_id !== undefined)
			updates.default_face_id = body.default_face_id;

		// Update profile
		const { data, error } = await supabase
			.from("profiles")
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update profile: ${error.message}`);
		}

		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error);
	}
}
