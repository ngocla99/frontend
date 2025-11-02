import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";
import {
	batchSignUrls,
	getSignedUrl,
} from "@/lib/utils/deduplicate-signed-urls";

/**
 * GET /api/connections
 * Get user's mutual connections (sorted by latest activity)
 *
 * Query params:
 * - status?: 'active' | 'blocked' | 'archived' (default: 'active')
 * - limit?: number (default: 50, max: 100)
 * - offset?: number (default: 0)
 */
export const GET = withSession(async ({ supabase, session, searchParams }) => {
	try {
		const status = searchParams.status || "active";
		const limit = Math.min(Number(searchParams.limit) || 50, 100);
		const offset = Number(searchParams.offset) || 0;

		// Validate status
		const validStatuses = ["active", "blocked", "archived"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json(
				{
					error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Get connections where user is either profile_a or profile_b
		const {
			data: connections,
			error,
			count,
		} = await supabase
			.from("mutual_connections")
			.select(
				`
        *,
        profile_a:profiles!mutual_connections_profile_a_id_fkey (
          id,
          name,
          default_face_id
        ),
        profile_b:profiles!mutual_connections_profile_b_id_fkey (
          id,
          name,
          default_face_id
        ),
        baby:babies (
          image_url
        )
      `,
				{ count: "exact" },
			)
			.or(
				`profile_a_id.eq.${session.user.id},profile_b_id.eq.${session.user.id}`,
			)
			.eq("status", status)
			.order("updated_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			throw error;
		}

		// OPTIMIZATION: First collect all face IDs to fetch in one query
		const faceIds = (connections || [])
			.map((conn: any) => {
				const otherUser =
					conn.profile_a_id === session.user.id
						? conn.profile_b
						: conn.profile_a;
				return otherUser.default_face_id;
			})
			.filter(Boolean);

		// Fetch all faces in one query
		const { data: faces } = await supabase
			.from("faces")
			.select("id, image_path")
			.in("id", faceIds);

		// Create face ID to image path map
		const faceMap = new Map(
			(faces || []).map((f: any) => [f.id, f.image_path]),
		);

		// Collect all unique image paths
		const imagePaths = Array.from(faceMap.values());

		// Batch sign all unique URLs at once
		const signedUrlMap = await batchSignUrls(
			supabase,
			STORAGE_BUCKETS.USER_IMAGES,
			imagePaths,
			env.SUPABASE_SIGNED_URL_TTL,
		);

		// For each connection, get the last message and unread count
		const enrichedConnections = await Promise.all(
			(connections || []).map(async (conn: any) => {
				// Determine the other user
				const otherUser =
					conn.profile_a_id === session.user.id
						? conn.profile_b
						: conn.profile_a;
				console.log("🚀 ~ otherUser:", otherUser);

				// Get other user's profile image from cache
				let profileImage = null;
				if (otherUser.default_face_id) {
					const imagePath = faceMap.get(otherUser.default_face_id);
					profileImage = getSignedUrl(signedUrlMap, imagePath);
				}

				// Get last message
				const { data: lastMessage } = await supabase
					.from("messages")
					.select("content, created_at, sender_id")
					.eq("connection_id", conn.id)
					.order("created_at", { ascending: false })
					.limit(1)
					.single();

				// Get unread count (messages not read by current user)
				const { count: unreadCount } = await supabase
					.from("messages")
					.select("*", { count: "exact", head: true })
					.eq("connection_id", conn.id)
					.neq("sender_id", session.user.id)
					.is("read_at", null);

				return {
					id: conn.id,
					other_user: {
						id: otherUser.id,
						name: otherUser.name,
						profile_image: profileImage,
					},
					baby_image: conn.baby?.image_url || null,
					last_message: lastMessage
						? {
								content: lastMessage.content,
								created_at: lastMessage.created_at,
								is_mine: lastMessage.sender_id === session.user.id,
							}
						: null,
					unread_count: unreadCount || 0,
					created_at: conn.created_at,
				};
			}),
		);

		return NextResponse.json({
			connections: enrichedConnections,
			total: count || 0,
		});
	} catch (error) {
		return handleApiError(error);
	}
});
