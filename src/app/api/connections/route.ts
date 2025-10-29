import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";
import { handleApiError } from "@/lib/middleware/error-handler";

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
		const { data: connections, error, count } = await supabase
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
			.or(`profile_a_id.eq.${session.user.id},profile_b_id.eq.${session.user.id}`)
			.eq("status", status)
			.order("updated_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			throw error;
		}

		// For each connection, get the last message and unread count
		const enrichedConnections = await Promise.all(
			(connections || []).map(async (conn: any) => {
				// Determine the other user
				const otherUser =
					conn.profile_a_id === session.user.id
						? conn.profile_b
						: conn.profile_a;

				// Get other user's profile image
				let profileImage = null;
				if (otherUser.default_face_id) {
					const { data: face } = await supabase
						.from("faces")
						.select("image_path")
						.eq("id", otherUser.default_face_id)
						.single();

					if (face) {
						const { data: signedUrl } = await supabase.storage
							.from("user_images")
							.createSignedUrl(face.image_path, 3600);
						profileImage = signedUrl?.signedUrl || null;
					}
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
