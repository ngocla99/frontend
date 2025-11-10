import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";

/**
 * POST /api/matches/[matchId]/react - Add reaction to match
 *
 * Request body:
 *   - reaction_type: 'like' | 'love' | 'wow' | etc.
 */
export const POST = withSession(
	async ({ request, params, session, supabase }) => {
		const matchId = params.matchId;
		const body = await request.json();
		const { reaction_type } = body;

		if (!reaction_type) {
			return NextResponse.json(
				{ error: "reaction_type is required" },
				{ status: 400 },
			);
		}

		// Verify match exists
		const { data: match, error: matchError } = await supabase
			.from("matches")
			.select("id")
			.eq("id", matchId)
			.single();

		if (matchError || !match) {
			return NextResponse.json({ error: "Match not found" }, { status: 404 });
		}

		// Insert new reaction
		// Unique constraint prevents duplicate reaction types per match
		const { data: reaction, error: createError } = await supabase
			.from("reactions")
			.insert({
				match_id: matchId,
				user_profile_id: session.profile.id,
				reaction_type,
			})
			.select()
			.single();

		// Check if error is duplicate (reaction already exists)
		if (createError?.code === "23505") {
			return NextResponse.json(
				{
					error: "Reaction already exists",
					match_id: matchId,
					reaction_type,
				},
				{ status: 409 },
			);
		}

		if (createError) {
			throw createError;
		}

		return NextResponse.json(
			{
				id: reaction.id,
				match_id: reaction.match_id,
				reaction_type: reaction.reaction_type,
				created: true,
			},
			{ status: 201 },
		);
	},
);

/**
 * DELETE /api/matches/[matchId]/react - Remove reaction from match
 *
 * Query params:
 *   - reaction_type: Type of reaction to remove (optional, removes all if not specified)
 */
export const DELETE = withSession(async ({ request, params, session, supabase }) => {
	const matchId = params.matchId;
	const { searchParams } = new URL(request.url);
	const reactionType = searchParams.get("reaction_type");

	// Build delete query
	let query = supabase
		.from("reactions")
		.delete()
		.eq("match_id", matchId)
		.eq("user_profile_id", session.profile.id);

	// If reaction_type specified, only delete that type
	if (reactionType) {
		query = query.eq("reaction_type", reactionType);
	}

	const { error: deleteError } = await query;

	if (deleteError) {
		throw deleteError;
	}

	return NextResponse.json({
		message: reactionType
			? `Reaction "${reactionType}" removed successfully`
			: "All reactions removed successfully",
		match_id: matchId,
		reaction_type: reactionType || "all",
	});
});

/**
 * GET /api/matches/[matchId]/react - Get user's reactions for this match
 *
 * Returns all reaction types for this match (e.g., ["like", "viewed"])
 */
export const GET = withSession(async ({ params, session, supabase }) => {
	const matchId = params.matchId;

	// Get all user's reactions for this match
	const { data: reactions, error: reactionError } = await supabase
		.from("reactions")
		.select("id, reaction_type, created_at")
		.eq("match_id", matchId)
		.eq("user_profile_id", session.profile.id);

	if (reactionError) {
		throw reactionError;
	}

	return NextResponse.json({
		reactions: reactions || [],
		reaction_types: reactions?.map((r) => r.reaction_type) || [],
	});
});
