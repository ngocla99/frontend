import { useQuery } from "@tanstack/react-query";

export const useLiveMatches = (taskId?: string, _userId?: string) => {
	// Note: Realtime subscription is now handled at component level, not here

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
		// refetchInterval: 30000, // Reduced polling since we have Supabase realtime
	});

	return {
		matches: matchesQuery.data || [],
		isLoading: matchesQuery.isLoading,
		error: matchesQuery.error,
		refetch: matchesQuery.refetch,
	};
};
