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

		// Check if reaction already exists
		const { data: existingReaction } = await supabase
			.from("reactions")
			.select("id, reaction_type")
			.eq("match_id", matchId)
			.eq("user_id", session.profile.id)
			.single();

		if (existingReaction) {
			// Update existing reaction
			const { data: reaction, error: updateError } = await supabase
				.from("reactions")
				.update({
					reaction_type,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingReaction.id)
				.select()
				.single();

			if (updateError) {
				throw updateError;
			}

			return NextResponse.json({
				id: reaction.id,
				match_id: reaction.match_id,
				reaction_type: reaction.reaction_type,
				updated: true,
			});
		}

		// Create new reaction
		const { data: reaction, error: createError } = await supabase
			.from("reactions")
			.insert({
				match_id: matchId,
				user_id: session.profile.id,
				reaction_type,
			})
			.select()
			.single();

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
 */
export const DELETE = withSession(async ({ params, session, supabase }) => {
	const matchId = params.matchId;

	// Delete reaction
	const { error: deleteError } = await supabase
		.from("reactions")
		.delete()
		.eq("match_id", matchId)
		.eq("user_id", session.profile.id);

	if (deleteError) {
		throw deleteError;
	}

	return NextResponse.json({
		message: "Reaction removed successfully",
		match_id: matchId,
	});
});

/**
 * GET /api/matches/[matchId]/react - Get user's reaction for this match
 */
export const GET = withSession(async ({ params, session, supabase }) => {
	const matchId = params.matchId;

	// Get user's reaction
	const { data: reaction, error: reactionError } = await supabase
		.from("reactions")
		.select("id, reaction_type, created_at")
		.eq("match_id", matchId)
		.eq("user_id", session.user.id)
		.single();

	if (reactionError) {
		if (reactionError.code === "PGRST116") {
			// No reaction found
			return NextResponse.json({ reaction: null });
		}
		throw reactionError;
	}

	return NextResponse.json({
		reaction: {
			id: reaction.id,
			reaction_type: reaction.reaction_type,
			created_at: reaction.created_at,
		},
	});
});
