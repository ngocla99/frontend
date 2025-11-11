import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";

/**
 * Match statistics response
 */
export interface MatchStats {
	total: number; // Total user-to-user matches in database
	viewed: number | null; // Matches current user has viewed (null if not authenticated)
	activeUsers: number; // Total number of user profiles in database
}

/**
 * API function to fetch match statistics
 *
 * Returns accurate count statistics for the live match feed.
 * Uses efficient SQL COUNT queries instead of client-side filtering.
 */
export const getMatchStatsApi = async (
	signal?: AbortSignal,
): Promise<MatchStats> => {
	return api.get<MatchStats>("/matches/top/stats", { signal });
};

/**
 * Query options for match statistics
 *
 * Useful for prefetching and advanced usage patterns.
 */
export const getMatchStatsQueryOptions = () => {
	return queryOptions({
		queryKey: ["matching", "stats"],
		queryFn: ({ signal }) => getMatchStatsApi(signal),
		staleTime: 1000 * 30, // Cache for 30 seconds
	});
};

/**
 * Hook options type
 */
type UseMatchStatsOptions = {
	queryConfig?: QueryConfig<typeof getMatchStatsQueryOptions>;
};

/**
 * React Query hook to fetch match statistics
 *
 * Returns accurate count statistics for the live match feed.
 * Uses efficient SQL COUNT queries instead of client-side filtering.
 *
 * Usage:
 * ```tsx
 * const { data: stats, isLoading } = useMatchStats();
 * console.log(stats?.total); // 500
 * console.log(stats?.viewed); // 45 (or null if not authenticated)
 * console.log(stats?.activeUsers); // 150
 * ```
 */
export const useMatchStats = ({ queryConfig }: UseMatchStatsOptions = {}) => {
	return useQuery({
		...getMatchStatsQueryOptions(),
		...queryConfig,
	});
};
