import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";

/**
 * PATCH /api/presence - Update user's last_seen timestamp
 *
 * This endpoint is called when a user disconnects from the presence channel
 * to persist their last_seen timestamp in the database.
 *
 * Body:
 * - last_seen: ISO 8601 timestamp
 *
 * Response:
 * - success: boolean
 * - last_seen: ISO 8601 timestamp
 */
export const PATCH = withSession(async ({ request, session, supabase }) => {
	const body = await request.json();

	// Validate last_seen timestamp
	if (!body.last_seen) {
		return NextResponse.json(
			{ error: "last_seen is required" },
			{ status: 400 },
		);
	}

	// Validate ISO 8601 format
	const lastSeenDate = new Date(body.last_seen);
	if (Number.isNaN(lastSeenDate.getTime())) {
		return NextResponse.json(
			{ error: "Invalid last_seen timestamp format (expected ISO 8601)" },
			{ status: 400 },
		);
	}

	// Update last_seen in profiles table
	const { data, error } = await supabase
		.from("profiles")
		.update({
			last_seen: body.last_seen,
		})
		.eq("id", session.user.id)
		.select("last_seen")
		.single();

	if (error) {
		console.error("[Presence API] Failed to update last_seen:", error);
		return NextResponse.json(
			{ error: "Failed to update last_seen" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		success: true,
		last_seen: data.last_seen,
	});
});
