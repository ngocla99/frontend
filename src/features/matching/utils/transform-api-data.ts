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
	console.log(
		"🚀 ~ transformApiMatchesToDisplayData ~ apiMatches:",
		apiMatches.map(transformApiMatchToDisplayData),
	);
	return apiMatches.map(transformApiMatchToDisplayData);
};

// Transform function for the new user match format
export const transformApiUserMatchToDisplayData = (
	userMatch: UserMatchApi,
): UniversityMatch => {
	return {
		user1: {
			name: userMatch.users.a.name,
			image: userMatch.users.a.image,
			age: 22,
			school: "Stanford University",
		},
		user2: {
			name: userMatch.users.b.name,
			image: userMatch.users.b.image,
			age: 22,
			school: "Stanford University",
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
	return userMatches.map(transformApiUserMatchToDisplayData);
};
