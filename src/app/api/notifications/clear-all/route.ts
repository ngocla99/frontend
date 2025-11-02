import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * DELETE /api/notifications/clear-all
 * Delete all notifications for the current user
 */
export const DELETE = withSession(async ({ supabase, session }) => {
	try {
		const { error } = await supabase
			.from("notifications")
			.delete()
			.eq("user_id", session.user.id);

		if (error) {
			throw error;
		}

		return NextResponse.json({
			success: true,
			message: "All notifications cleared",
		});
	} catch (error) {
		return handleApiError(error);
	}
});
