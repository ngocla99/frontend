import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/matches/top/stats - Get count statistics for live matches
 *
 * Returns accurate count statistics for the live match feed.
 * Uses efficient SQL COUNT queries instead of client-side filtering.
 *
 * Response:
 * {
 *   total: 500,        // Total user-to-user matches in database
 *   viewed: 45,        // Matches current user has viewed (null if not authenticated)
 *   activeUsers: 150   // Total number of user profiles in database
 * }
 */
export async function GET(_request: NextRequest) {
	try {
		const supabase = await createClient();

		// Get current user session (optional - for viewed count)
		const {
			data: { user },
		} = await supabase.auth.getUser();
		const currentUserId = user?.id || null;

		// Query 1: Count total user-to-user matches
		// Note: We need to use RPC or a more efficient query since
		// Supabase client doesn't support complex COUNT with JOINs easily
		const { count: totalCount, error: totalError } = await supabase
			.from("matches")
			.select("id", { count: "exact", head: true });

		if (totalError) {
			throw totalError;
		}

		// Query 2: Count viewed matches (if authenticated)
		let viewedCount: number | null = null;
		if (currentUserId) {
			const { count, error: viewedError } = await supabase
				.from("reactions")
				.select("match_id", { count: "exact", head: true })
				.eq("user_profile_id", currentUserId)
				.eq("reaction_type", "viewed");

			if (viewedError) {
				throw viewedError;
			}

			viewedCount = count || 0;
		}

		// Query 3: Count total number of user profiles
		const { count: activeUsersCount, error: activeUsersError } = await supabase
			.from("profiles")
			.select("id", { count: "exact", head: true });

		if (activeUsersError) {
			throw activeUsersError;
		}

		return NextResponse.json({
			total: totalCount || 0,
			viewed: viewedCount,
			activeUsers: activeUsersCount || 0,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
