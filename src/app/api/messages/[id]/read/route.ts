import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * PATCH /api/messages/[id]/read
 * Mark message as read
 */
export const PATCH = withSession(async ({ params, supabase, session }) => {
	try {
		const messageId = params.id;

		if (!messageId) {
			return NextResponse.json(
				{ error: "Message ID is required" },
				{ status: 400 },
			);
		}

		// Get message and verify access
		const { data: message, error: msgError } = await supabase
			.from("messages")
			.select(
				`
        *,
        connection:mutual_connections (
          profile_a_id,
          profile_b_id
        )
      `,
			)
			.eq("id", messageId)
			.single();

		if (msgError || !message) {
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		// Type assertion for connection
		const conn: any = Array.isArray(message.connection)
			? message.connection[0]
			: message.connection;

		// Verify user is part of the connection
		const isUserInConnection =
			conn.profile_a_id === session.user.id ||
			conn.profile_b_id === session.user.id;

		if (!isUserInConnection) {
			return NextResponse.json(
				{ error: "Access denied to this message" },
				{ status: 403 },
			);
		}

		// Only mark as read if user is not the sender
		if (message.sender_id === session.user.id) {
			return NextResponse.json(
				{ error: "Cannot mark own message as read" },
				{ status: 400 },
			);
		}

		// Update read_at timestamp
		const { data: updatedMessage, error: updateError } = await supabase
			.from("messages")
			.update({ read_at: new Date().toISOString() })
			.eq("id", messageId)
			.select()
			.single();

		if (updateError) {
			throw updateError;
		}

		return NextResponse.json({
			id: updatedMessage.id,
			read_at: updatedMessage.read_at,
		});
	} catch (error) {
		return handleApiError(error);
	}
});
