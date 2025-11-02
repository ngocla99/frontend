import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/connections/[id]
 * Get specific connection details
 */
export const GET = withSession(async ({ params, supabase, session }) => {
	try {
		const connectionId = params.id;

		if (!connectionId) {
			return NextResponse.json(
				{ error: "Connection ID is required" },
				{ status: 400 },
			);
		}

		// Get connection with full profile details
		const { data: connection, error } = await supabase
			.from("mutual_connections")
			.select(
				`
        *,
        profile_a:profiles!mutual_connections_profile_a_id_fkey (
          id,
          name,
          gender,
          school,
          default_face_id
        ),
        profile_b:profiles!mutual_connections_profile_b_id_fkey (
          id,
          name,
          gender,
          school,
          default_face_id
        ),
        baby:babies (
          image_url
        )
      `,
			)
			.eq("id", connectionId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Connection not found" },
					{ status: 404 },
				);
			}
			throw error;
		}

		// Verify user is part of this connection
		const connData: any = connection;
		const isUserInConnection =
			connData.profile_a_id === session.user.id ||
			connData.profile_b_id === session.user.id;

		if (!isUserInConnection) {
			return NextResponse.json(
				{ error: "Access denied to this connection" },
				{ status: 403 },
			);
		}

		// Get profile images for both users
		const getProfileImage = async (
			_profileId: string,
			faceId: string | null,
		) => {
			if (!faceId) return null;

			const { data: face } = await supabase
				.from("faces")
				.select("image_path")
				.eq("id", faceId)
				.single();

			if (!face) return null;

			const { data: signedUrl } = await supabase.storage
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(face.image_path, env.SUPABASE_SIGNED_URL_TTL);

			return signedUrl?.signedUrl || null;
		};

		const [profileAImage, profileBImage] = await Promise.all([
			getProfileImage(
				connData.profile_a.id,
				connData.profile_a.default_face_id,
			),
			getProfileImage(
				connData.profile_b.id,
				connData.profile_b.default_face_id,
			),
		]);

		return NextResponse.json({
			id: connData.id,
			profile_a: {
				id: connData.profile_a.id,
				name: connData.profile_a.name,
				gender: connData.profile_a.gender,
				school: connData.profile_a.school,
				profile_image: profileAImage,
			},
			profile_b: {
				id: connData.profile_b.id,
				name: connData.profile_b.name,
				gender: connData.profile_b.gender,
				school: connData.profile_b.school,
				profile_image: profileBImage,
			},
			match_id: connData.match_id,
			baby_image: connData.baby?.image_url || null,
			status: connData.status,
			created_at: connData.created_at,
		});
	} catch (error) {
		return handleApiError(error);
	}
});
