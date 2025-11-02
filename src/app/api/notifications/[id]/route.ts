import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export const DELETE = withSession(async ({ supabase, session, params }) => {
	try {
		const notificationId = params.id;

		if (!notificationId) {
			return NextResponse.json(
				{ error: "Notification ID is required" },
				{ status: 400 },
			);
		}

		// Delete the notification (RLS policy ensures user can only delete their own)
		const { error } = await supabase
			.from("notifications")
			.delete()
			.eq("id", notificationId)
			.eq("user_id", session.user.id);

		if (error) {
			throw error;
		}

		return NextResponse.json({
			success: true,
			message: "Notification deleted",
		});
	} catch (error) {
		return handleApiError(error);
	}
});
