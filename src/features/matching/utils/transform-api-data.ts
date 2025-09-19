import type { LiveMatchApi } from "@/types/api";
import type { MatchCardProps } from "../components/live-match/match-card";

export const transformApiMatchToCardData = (
	apiMatch: LiveMatchApi,
): MatchCardProps["data"] => {
	// Calculate time ago from created_at
	const getTimeAgo = (createdAt: string): string => {
		const now = new Date();
		const created = new Date(createdAt);
		const diffInSeconds = Math.floor(
			(now.getTime() - created.getTime()) / 1000,
		);

		if (diffInSeconds < 60) return "just now";
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400)
			return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	};

	return {
		user1: {
			name: apiMatch.user_a_name.split(" ")[0], // Take only first name
			image: apiMatch.user_a_image_url,
		},
		user2: {
			name: apiMatch.user_b_name.split(" ")[0], // Take only first name
			image: apiMatch.user_b_image_url,
		},
		matchPercentage: Math.round(apiMatch.similarity),
		timestamp: getTimeAgo(apiMatch.created_at),
		isNew: true, // All matches from API are considered new initially
		isViewed: false, // All matches from API are unviewed initially
	};
};

export const transformApiMatchesToCardData = (
	apiMatches: LiveMatchApi[],
): MatchCardProps["data"][] => {
	return apiMatches.map(transformApiMatchToCardData);
};
