import type { SupabaseClient } from "@supabase/supabase-js";
import { getRandomIcebreaker } from "../../utils/icebreakers";
import { createAndBroadcastNotification } from "./notifications";

/**
 * Mutual connection data structure
 */
export type MutualConnection = {
	id: string;
	profile_a_id: string;
	profile_b_id: string;
	match_id: string;
	baby_id: string | null;
	status: "active" | "blocked" | "archived";
	created_at: string;
	updated_at: string;
};

/**
 * Check if a mutual connection exists for a match
 *
 * @param supabase - Supabase client
 * @param matchId - Match ID
 * @returns Mutual connection if exists, null otherwise
 */
export async function checkMutualConnection(
	supabase: SupabaseClient,
	matchId: string,
): Promise<MutualConnection | null> {
	const { data: connection, error } = await supabase
		.from("mutual_connections")
		.select("*")
		.eq("match_id", matchId)
		.single();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return connection;
}

/**
 * Check if both users have generated babies for a match
 *
 * @param supabase - Supabase client
 * @param matchId - Match ID
 * @param profileAId - Profile A ID
 * @param profileBId - Profile B ID
 * @returns True if both users have generated babies
 */
export async function checkBothUsersGeneratedBaby(
	supabase: SupabaseClient,
	matchId: string,
	profileAId: string,
	profileBId: string,
): Promise<boolean> {
	// Get all babies for this match
	const { data: babies, error } = await supabase
		.from("babies")
		.select("generated_by_profile_id")
		.eq("match_id", matchId);

	if (error) {
		throw error;
	}

	if (!babies || babies.length === 0) {
		return false;
	}

	// Check if we have babies from both users
	const generatedByA = babies.some(
		(baby) => baby.generated_by_profile_id === profileAId,
	);
	const generatedByB = babies.some(
		(baby) => baby.generated_by_profile_id === profileBId,
	);

	return generatedByA && generatedByB;
}

/**
 * Create a mutual connection between two users
 *
 * @param supabase - Supabase client
 * @param params - Connection parameters
 * @returns Created mutual connection with icebreaker
 */
export async function createMutualConnection(
	supabase: SupabaseClient,
	params: {
		profile_a_id: string;
		profile_b_id: string;
		match_id: string;
		baby_id?: string;
	},
): Promise<{ connection: MutualConnection; icebreaker: string }> {
	// Ensure profile_a_id < profile_b_id for consistent ordering
	const [profileA, profileB] =
		params.profile_a_id < params.profile_b_id
			? [params.profile_a_id, params.profile_b_id]
			: [params.profile_b_id, params.profile_a_id];

	// Create mutual connection
	const { data: connection, error: connectionError } = await supabase
		.from("mutual_connections")
		.insert({
			profile_a_id: profileA,
			profile_b_id: profileB,
			match_id: params.match_id,
			baby_id: params.baby_id || null,
		})
		.select()
		.single();

	if (connectionError) {
		throw connectionError;
	}

	// Get random icebreaker message
	const icebreaker = getRandomIcebreaker();

	// Insert icebreaker as first message
	const { error: messageError } = await supabase.from("messages").insert({
		connection_id: connection.id,
		sender_id: profileA, // System message, use profile A as sender
		content: icebreaker,
		message_type: "icebreaker",
	});

	if (messageError) {
		console.error("Failed to create icebreaker message:", messageError);
		// Don't throw - connection is created, message is optional
	}

	// Create notifications for both users
	await Promise.all([
		createAndBroadcastNotification(supabase, {
			user_id: profileA,
			type: "mutual_match",
			title: "Chat unlocked! 💬",
			message: "You both generated a baby! Start chatting now.",
			related_id: connection.id,
			related_type: "connection",
		}),
		createAndBroadcastNotification(supabase, {
			user_id: profileB,
			type: "mutual_match",
			title: "Chat unlocked! 💬",
			message: "You both generated a baby! Start chatting now.",
			related_id: connection.id,
			related_type: "connection",
		}),
	]);

	return { connection, icebreaker };
}

/**
 * Get the other user in a connection
 *
 * @param connection - Mutual connection
 * @param currentUserId - Current user ID
 * @returns Other user ID
 */
export function getOtherUserId(
	connection: MutualConnection,
	currentUserId: string,
): string {
	return connection.profile_a_id === currentUserId
		? connection.profile_b_id
		: connection.profile_a_id;
}

/**
 * Check if user is part of a connection
 *
 * @param connection - Mutual connection
 * @param userId - User ID to check
 * @returns True if user is part of connection
 */
export function isUserInConnection(
	connection: MutualConnection,
	userId: string,
): boolean {
	return (
		connection.profile_a_id === userId || connection.profile_b_id === userId
	);
}
