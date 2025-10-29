import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createAndBroadcastNotification } from "@/lib/notifications";
import { getOtherUserId } from "@/lib/connections";

/**
 * POST /api/messages
 * Send a new message
 *
 * Body:
 * {
 *   connection_id: string;
 *   content: string;
 *   message_type?: 'text' | 'image'; // default: 'text'
 * }
 */
export const POST = withSession(async ({ request, supabase, session }) => {
	try {
		const body = await request.json();
		const { connection_id, content, message_type = "text" } = body;

		// Validate required fields
		if (!connection_id || !content) {
			return NextResponse.json(
				{ error: "connection_id and content are required" },
				{ status: 400 },
			);
		}

		// Validate message_type
		const validTypes = ["text", "image"];
		if (!validTypes.includes(message_type)) {
			return NextResponse.json(
				{
					error: `Invalid message_type. Must be one of: ${validTypes.join(", ")}`,
				},
				{ status: 400 },
			);
		}

		// Verify user is part of this connection
		const { data: connection, error: connError } = await supabase
			.from("mutual_connections")
			.select("*")
			.eq("id", connection_id)
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

		// Check connection is active
		if (connection.status !== "active") {
			return NextResponse.json(
				{ error: "Cannot send messages to inactive connection" },
				{ status: 403 },
			);
		}

		// Insert message
		const { data: message, error: messageError } = await supabase
			.from("messages")
			.insert({
				connection_id,
				sender_id: session.user.id,
				content,
				message_type,
			})
			.select()
			.single();

		if (messageError) {
			throw messageError;
		}

		// Update connection updated_at timestamp
		await supabase
			.from("mutual_connections")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", connection_id);

		// Get sender profile info
		const { data: senderProfile } = await supabase
			.from("profiles")
			.select("name")
			.eq("id", session.user.id)
			.single();

		// Broadcast message via Realtime
		const channel = supabase.channel(`connection:${connection_id}`);
		await channel.send({
			type: "broadcast",
			event: "message",
			payload: {
				...message,
				sender_name: senderProfile?.name || "Unknown",
			},
		});

		// Send notification to the other user
		const otherUserId = getOtherUserId(connection, session.user.id);
		await createAndBroadcastNotification(supabase, {
			user_id: otherUserId,
			type: "new_message",
			title: `New message from ${senderProfile?.name || "Unknown"}`,
			message: content.substring(0, 100), // Preview first 100 chars
			related_id: message.id,
			related_type: "message",
		});

		return NextResponse.json(
			{
				id: message.id,
				connection_id: message.connection_id,
				sender_id: message.sender_id,
				content: message.content,
				message_type: message.message_type,
				created_at: message.created_at,
			},
			{ status: 201 },
		);
	} catch (error) {
		return handleApiError(error);
	}
});
