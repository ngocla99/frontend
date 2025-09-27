import { useQuery } from "@tanstack/react-query";
import { useLiveMatchRealtime } from "./use-live-match-realtime";

export const useLiveMatches = (taskId?: string, userId?: string) => {
	// Enable Supabase realtime for new matches
	useLiveMatchRealtime(userId);

	// Query for existing matches
	const matchesQuery = useQuery({
		queryKey: ["live-matches", taskId],
		queryFn: async () => {
			if (!taskId) return [];

			const response = await fetch(`/api/live-matches/${taskId}`);
			if (!response.ok) throw new Error("Failed to fetch matches");
			return response.json();
		},
		enabled: !!taskId,
		refetchInterval: 30000, // Reduced polling since we have Supabase realtime
	});

	return {
		matches: matchesQuery.data || [],
		isLoading: matchesQuery.isLoading,
		error: matchesQuery.error,
		refetch: matchesQuery.refetch,
	};
};
