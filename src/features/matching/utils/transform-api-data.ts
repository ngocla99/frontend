import type { MatchCardProps } from "@/features/matching/components/live-match/match-card";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match-tab";
import { getTimeAgo } from "@/lib/utils/date";
import type { LiveMatchApi, UserMatchApi } from "@/types/api";

export const transformApiMatchToDisplayData = (
	apiMatch: LiveMatchApi,
): MatchCardProps["data"] => {
	return {
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
	};
};

export const transformApiUserMatchesToDisplayData = (
	userMatches: UserMatchApi[],
): UniversityMatch[] => {
	return userMatches.map((userMatch) =>
		transformApiUserMatchToDisplayData(userMatch),
	);
};
