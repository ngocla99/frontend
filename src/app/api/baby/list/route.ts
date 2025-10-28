import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/baby/list - List user's baby images
 *
 * Query params:
 *   - user_id: Filter by user (optional, defaults to current user)
 *   - limit: Number of results (default: 20)
 *   - skip: Pagination offset (default: 0)
 */
export const GET = withSession(async ({ session, searchParams, supabase }) => {
	const userId = searchParams.user_id || session.user.id;
	const limit = parseInt(searchParams.limit || "20", 10);
	const skip = parseInt(searchParams.skip || "0", 10);

	// Get babies where user is either parent
	const { data: babies, error: babiesError } = await supabase
		.from("babies")
		.select(`
        id,
        match_id,
        image_url,
        created_at,
        parent_a:profiles!babies_parent_a_id_fkey (
          id,
          name,
          gender
        ),
        parent_b:profiles!babies_parent_b_id_fkey (
          id,
          name,
          gender
        ),
        match:matches (
          id,
          similarity_score
        )
      `)
		.or(`parent_a_id.eq.${userId},parent_b_id.eq.${userId}`)
		.order("created_at", { ascending: false })
		.range(skip, skip + limit - 1);

	if (babiesError) {
		throw babiesError;
	}

	const formattedBabies = (babies || []).map((baby: any) => ({
		id: baby.id,
		match_id: baby.match_id,
		image_url: baby.image_url,
		created_at: baby.created_at,
		similarity_score:
			baby.match?.[0]?.similarity_score || baby.match?.similarity_score,
		parents: {
			a: baby.parent_a,
			b: baby.parent_b,
		},
	}));

	return NextResponse.json({
		babies: formattedBabies,
		total: formattedBabies.length,
		skip,
		limit,
	});
});
