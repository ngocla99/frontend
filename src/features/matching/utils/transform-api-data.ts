import type { MatchCardProps } from "@/features/matching/components/live-match/match-card";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match-tab";
import type { SupabaseMatch } from "@/lib/supabase";
import { getTimeAgo } from "@/lib/utils/date";
import type { LiveMatchApi, UserMatchApi } from "@/types/api";

export const transformApiMatchToDisplayData = (
	apiMatch: LiveMatchApi,
): MatchCardProps["data"] => {
	return {
		id: apiMatch.id,
		user1: {
			name: apiMatch.users.a.name,
			image: apiMatch.users.a.image,
		},
		user2: {
			name: apiMatch.users.b.name,
			image: apiMatch.users.b.image,
		},
		matchPercentage: Math.round(apiMatch.similarity_score),
		timestamp: getTimeAgo(apiMatch.created_at),
		isNew: true, // All matches from API are considered new initially
		isViewed: false, // All matches from API are unviewed initially
		isFavorited:
			Array.isArray(apiMatch.my_reaction) &&
			apiMatch.my_reaction.includes("favorite"),
	};
};

export const transformApiMatchesToDisplayData = (
	apiMatches: LiveMatchApi[],
): MatchCardProps["data"][] => {
	return apiMatches.map(transformApiMatchToDisplayData);
};

// Transform function for the new user match format
export const transformApiUserMatchToDisplayData = (
	userMatch: UserMatchApi,
): UniversityMatch => {
	// Let user1 is current user
	const user1 = userMatch.me;
	const user2 = userMatch.other;
	return {
		id: userMatch.id,
		user1: {
			name: user1.name,
			image: user1.image,
			age: 22,
			school: user1.school,
		},
		user2: {
			name: user2.name,
			image: user2.image,
			age: 22,
			school: user2.school,
		},
		matchPercentage: Math.round(userMatch.similarity_score),
		timestamp: getTimeAgo(userMatch.created_at),
		isNew: true,
		isViewed: false, // All matches from API are unviewed initially
		isFavorited: Boolean(userMatch.reactions?.favorite),
	};
};

export const transformApiUserMatchesToDisplayData = (
	userMatches: UserMatchApi[],
): UniversityMatch[] => {
	return userMatches.map((userMatch) =>
		transformApiUserMatchToDisplayData(userMatch),
	);
};

// Transform raw Supabase match data to LiveMatchApi format
// Note: This requires additional API calls to get user data
export const transformSupabaseMatchToApiFormat = async (
	supabaseMatch: SupabaseMatch,
	getUserById: (id: string) => Promise<{ name: string; image: string }>,
): Promise<LiveMatchApi> => {
	// This would need to fetch user data based on face_a_id and face_b_id
	// For now, we'll create a placeholder structure
	const userA = await getUserById(supabaseMatch.face_a_id);
	const userB = await getUserById(supabaseMatch.face_b_id);

	return {
		id: supabaseMatch.id,
		created_at: supabaseMatch.created_at,
		similarity_score: supabaseMatch.similarity_score,
		my_reaction: [], // Default empty
		reactions: {}, // Default empty
		users: {
			a: {
				id: supabaseMatch.face_a_id,
				name: userA.name,
				image: userA.image,
			},
			b: {
				id: supabaseMatch.face_b_id,
				name: userB.name,
				image: userB.image,
			},
		},
	};
};

// Simplified approach: Transform Supabase match directly to display format
// This avoids the need for additional API calls in realtime updates
export const transformSupabaseMatchToDisplayData = (
	supabaseMatch: SupabaseMatch,
): MatchCardProps["data"] => {
	return {
		id: supabaseMatch.id,
		user1: {
			name: "User A", // Placeholder - would need user lookup
			image: "/placeholder-avatar.png", // Placeholder
		},
		user2: {
			name: "User B", // Placeholder - would need user lookup
			image: "/placeholder-avatar.png", // Placeholder
		},
		matchPercentage: Math.round(supabaseMatch.similarity_score),
		timestamp: getTimeAgo(supabaseMatch.created_at),
		isNew: true,
		isViewed: false,
		isFavorited: false,
	};
};
