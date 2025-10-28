import type { MatchCardProps } from "@/features/matching/components/live-match/match-card";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match/university-match-tab";
import { getTimeAgo } from "@/lib/utils/date";
import type {
	CelebMatchApi,
	LiveMatchApi,
	SupabaseMatch,
	UserMatchApi,
} from "@/types/api";

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

// Transform function for the new group match format
export const transformApiUserMatchToDisplayData = (
	userMatch: UserMatchApi,
): UniversityMatch => {
	// Sort matches by created_at (most recent first)
	const sortedMatches = [...userMatch.matches].sort(
		(a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);

	// Get the most recent match (first in sorted array)
	const recentMatch = sortedMatches[0];

	// Check if any match is favorited
	const isFavorited = userMatch.matches.some((match) =>
		Boolean(match.reactions?.favorite),
	);

	// Transform matches to include other user info
	const transformedMatches = sortedMatches.map((match) => ({
		id: match.id,
		createdAt: match.created_at,
		name: userMatch.other.name,
		image: match.other_image,
		school: userMatch.other.school,
		reactions: match.reactions,
		matchPercentage: Math.round(match.similarity_score),
		isNew: true,
	}));

	return {
		id: transformedMatches[0].id, // Use the most recent match ID as the group match ID
		me: {
			name: userMatch.me.name,
			image: recentMatch.my_image,
			age: 22,
			school: userMatch.me.school,
		},
		other: {
			name: userMatch.other.name,
			image: userMatch.other.image,
			age: 22,
			school: userMatch.other.school,
		},
		matchPercentage: Math.round(recentMatch.similarity_score),
		numberOfMatches: userMatch.number_of_matches,
		timestamp: getTimeAgo(recentMatch.created_at),
		isNew: true,
		isFavorited,
		matches: transformedMatches,
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

// Transform celebrity match data to display format
export interface CelebMatch {
	id: string;
	me: {
		name: string;
		image: string;
		school: string;
	};
	celeb: {
		id: string;
		name: string;
		image: string;
		school: string | null;
	};
	matchPercentage: number;
	timestamp: string;
	isNew: boolean;
	isFavorited: boolean;
}

export const transformApiCelebMatchToDisplayData = (
	celebMatch: CelebMatchApi,
): CelebMatch => {
	const isFavorited =
		Array.isArray(celebMatch.my_reaction) &&
		celebMatch.my_reaction.includes("favorite");

	return {
		id: celebMatch.id,
		me: {
			name: celebMatch.me.name,
			image: celebMatch.me.image,
			school: celebMatch.me.school,
		},
		celeb: {
			id: celebMatch.celeb.id,
			name: celebMatch.celeb.name,
			image: celebMatch.celeb.image_url,
			school: celebMatch.celeb.school,
		},
		matchPercentage: Math.round(celebMatch.similarity_score),
		timestamp: getTimeAgo(celebMatch.created_at),
		isNew: true,
		isFavorited,
	};
};

export const transformApiCelebMatchesToDisplayData = (
	celebMatches: CelebMatchApi[],
): CelebMatch[] => {
	return celebMatches.map((celebMatch) =>
		transformApiCelebMatchToDisplayData(celebMatch),
	);
};
