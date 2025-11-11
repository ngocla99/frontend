import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * POST /api/matches/[matchId]/view - Mark match as viewed
 *
 * Tracks when a user views a match by creating a "viewed" reaction.
 * This is idempotent - calling multiple times has no additional effect.
 */
export const POST = withSession(async ({ params, session, supabase }) => {
	try {
		const matchId = params.matchId;

		if (!matchId) {
			return NextResponse.json(
				{ error: "Match ID is required" },
				{ status: 400 },
			);
		}

		// Insert "viewed" reaction without checking if match exists
		// This is faster and the foreign key constraint will catch invalid match_ids
		const { error } = await supabase.from("reactions").insert({
			match_id: matchId,
			user_profile_id: session.profile.id,
			reaction_type: "viewed",
		});

		// Check if error is duplicate (already viewed) - this is OK
		const isDuplicate = error?.code === "23505";

		// Check if error is foreign key violation (invalid match_id)
		const isInvalidMatch = error?.code === "23503";

		if (isInvalidMatch) {
			return NextResponse.json({ error: "Match not found" }, { status: 404 });
		}

		if (error && !isDuplicate) {
			console.error("Error creating viewed reaction:", error);
			return NextResponse.json(
				{
					error: "Failed to mark match as viewed",
					details: error.message,
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			match_id: matchId,
			already_viewed: isDuplicate,
		});
	} catch (error) {
		return handleApiError(error);
	}
});
