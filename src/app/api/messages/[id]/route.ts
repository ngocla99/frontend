import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/messages/[id]
 * Get messages for a connection (paginated, newest first)
 *
 * Query params:
 * - limit?: number (default: 50, max: 100)
 * - before?: string (ISO timestamp cursor for pagination)
 */
export const GET = withSession(
	async ({ params, supabase, session, searchParams }) => {
		try {
			const connectionId = params.id;

			if (!connectionId) {
				return NextResponse.json(
					{ error: "Connection ID is required" },
					{ status: 400 },
				);
			}

			const limit = Math.min(Number(searchParams.limit) || 50, 100);
			const before = searchParams.before; // ISO timestamp

			// Verify user is part of this connection
			const { data: connection, error: connError } = await supabase
				.from("mutual_connections")
				.select("*")
				.eq("id", connectionId)
				.single();

			if (connError || !connection) {
				return NextResponse.json(
					{ error: "Connection not found" },
					{ status: 404 },
				);
			}

			const isUserInConnection =
				connection.profile_a_id === session.user.id ||
				connection.profile_b_id === session.user.id;

			if (!isUserInConnection) {
				return NextResponse.json(
					{ error: "Access denied to this connection" },
					{ status: 403 },
				);
			}

			// Build query for messages
			let query = supabase
				.from("messages")
				.select(
					`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            name
          )
        `,
				)
				.eq("connection_id", connectionId)
				.order("created_at", { ascending: false })
				.limit(limit + 1); // Fetch one extra to check if there are more

			// Apply cursor if provided
			if (before) {
				query = query.lt("created_at", before);
			}

			const { data: messages, error } = await query;

			if (error) {
				throw error;
			}

			// Check if there are more messages
			const hasMore = (messages || []).length > limit;
			const messagesData = hasMore
				? (messages || []).slice(0, limit)
				: messages || [];

			// Get next cursor (timestamp of oldest message)
			const nextCursor =
				hasMore && messagesData.length > 0
					? messagesData[messagesData.length - 1].created_at
					: null;

			// Format messages
			const formattedMessages = messagesData.map((msg: any) => ({
				id: msg.id,
				sender_id: msg.sender_id,
				sender_name: msg.sender?.name || "Unknown",
				content: msg.content,
				message_type: msg.message_type,
				read_at: msg.read_at,
				created_at: msg.created_at,
			}));

			return NextResponse.json({
				messages: formattedMessages,
				has_more: hasMore,
				next_cursor: nextCursor,
			});
		} catch (error) {
			return handleApiError(error);
		}
	},
);
