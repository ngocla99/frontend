import type { MatchCardProps } from "@/features/matching/components/live-match/match-card";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match-tab";
import { getTimeAgo } from "@/lib/utils/date";
import type { LiveMatchApi, UserMatchApi } from "@/types/api";

export const transformApiMatchToDisplayData = (
	apiMatch: LiveMatchApi,
): MatchCardProps["data"] => {
	return {
		user1: {
			name: apiMatch.user_a_name,
			image: apiMatch.user_a_image_url,
		},
		user2: {
			name: apiMatch.user_b_name,
			image: apiMatch.user_b_image_url,
		},
		matchPercentage: Math.round(apiMatch.similarity),
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
	userMatch: UserMatchApi & { target_face_id?: string },
): UniversityMatch => {
	return {
		user: {
			name: userMatch.name,
			image: userMatch.image_url,
			age: 22,
			university: "Stanford University",
		},
		target_face_id: userMatch?.target_face_id,
		matchPercentage: Math.round(userMatch.similarity),
		timestamp: getTimeAgo(userMatch.created_at),
		isNew: true, // All matches from API are considered new initially
		isViewed: false, // All matches from API are unviewed initially
	};
};

export const transformApiUserMatchesToDisplayData = (
	userMatches: UserMatchApi[],
): UniversityMatch[] => {
	return userMatches.map(transformApiUserMatchToDisplayData);
};
