import type { MatchCardProps } from "@/features/matching/components/live-match/match-card";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match/university-match-tab";
import { getTimeAgo } from "@/lib/utils/date";
import type { CelebMatchApi, LiveMatchApi, UserMatchApi } from "@/types/api";

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
		matchPercentage: Math.round(apiMatch.similarity_percentage),
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
		matchPercentage: Math.round(match.similarity_percentage),
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
		matchPercentage: Math.round(recentMatch.similarity_percentage),
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

// Transform celebrity match data to display format
export interface CelebMatch {
	id: string;
	celeb: {
		id: string;
		name: string;
		image: string;
		school: string | null;
		bio?: string | null;
		category?: string | null;
	};
	matchPercentage: number;
	timestamp: string;
	isNew: boolean;
	isFavorited: boolean;
}

export const transformApiCelebMatchToDisplayData = (
	celebMatch: CelebMatchApi,
): CelebMatch => {
	const celebrity = celebMatch.celebrity;

	if (!celebrity) {
		throw new Error("Celebrity data is missing");
	}

	// Convert similarity_score to percentage
	// Assuming similarity_score is already a percentage (0-100) or needs conversion
	const matchPercentage = Math.round(celebMatch.similarity_score * 100);

	return {
		id: celebMatch.id,
		celeb: {
			id: celebrity.id,
			name: celebrity.name,
			image: celebrity.image_url,
			school: null, // Celebrity doesn't have school
			bio: celebrity.bio,
			category: celebrity.category,
		},
		matchPercentage,
		timestamp: getTimeAgo(celebMatch.created_at),
		isNew: true,
		isFavorited: false, // TODO: Add reaction support later
	};
};

export const transformApiCelebMatchesToDisplayData = (
	celebMatches: CelebMatchApi[],
): CelebMatch[] => {
	return celebMatches.map((celebMatch) =>
		transformApiCelebMatchToDisplayData(celebMatch),
	);
};
