import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export const PATCH = withSession(async ({ supabase, session }) => {
	try {
		const { error } = await supabase
			.from("notifications")
			.update({ read_at: new Date().toISOString() })
			.eq("user_id", session.user.id)
			.is("read_at", null);

		if (error) {
			throw error;
		}

		return NextResponse.json({
			success: true,
			message: "All notifications marked as read",
		});
	} catch (error) {
		return handleApiError(error);
	}
});
