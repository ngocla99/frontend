import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * PATCH /api/notifications/[id]/read
 * Mark notification as read
 */
export const PATCH = withSession(async ({ params, supabase, session }) => {
	try {
		const notificationId = params.id;

		if (!notificationId) {
			return NextResponse.json(
				{ error: "Notification ID is required" },
				{ status: 400 },
			);
		}

		// Update notification read_at timestamp
		// RLS policy ensures user can only update their own notifications
		const { data: notification, error } = await supabase
			.from("notifications")
			.update({ read_at: new Date().toISOString() })
			.eq("id", notificationId)
			.eq("user_id", session.user.id)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Notification not found" },
					{ status: 404 },
				);
			}
			throw error;
		}

		return NextResponse.json({
			id: notification.id,
			read_at: notification.read_at,
		});
	} catch (error) {
		return handleApiError(error);
	}
});
