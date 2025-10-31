import { NextResponse } from "next/server";
import { checkMutualConnection } from "@/lib/connections";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * POST /api/connections/check
 * Check if mutual connection exists for a match
 *
 * Body:
 * {
 *   match_id: string;
 * }
 */
export const POST = withSession(async ({ request, supabase }) => {
	try {
		const body = await request.json();
		const { match_id } = body;

		if (!match_id) {
			return NextResponse.json(
				{ error: "match_id is required" },
				{ status: 400 },
			);
		}

		const connection = await checkMutualConnection(supabase, match_id);

		if (!connection) {
			return NextResponse.json({
				exists: false,
				connection: null,
			});
		}

		return NextResponse.json({
			exists: true,
			connection: {
				id: connection.id,
				profile_a_id: connection.profile_a_id,
				profile_b_id: connection.profile_b_id,
				match_id: connection.match_id,
				baby_id: connection.baby_id,
				status: connection.status,
				created_at: connection.created_at,
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
});
