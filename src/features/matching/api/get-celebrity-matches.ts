import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { CelebrityMatch } from "@/types/api";

/**
 * Input for fetching celebrity matches
 */
export type GetCelebrityMatchesInput = {
	faceId?: string; // Optional - defaults to user's default_face_id
	limit?: number;
	category?: string; // Filter by category: 'actor', 'musician', 'athlete', 'influencer'
};

/**
 * API function to fetch celebrity matches
 */
export const getCelebrityMatchesApi = async (
	input: GetCelebrityMatchesInput = {},
	_signal?: AbortSignal,
): Promise<CelebrityMatch[]> => {
	const response = await api.get<{
		matches: CelebrityMatch[];
		total: number;
	}>("/matches/celebrity", { params: input });
	return response.matches;
};

/**
 * Query options for celebrity matches
 */
export const getCelebrityMatchesQueryOptions = (
	input: GetCelebrityMatchesInput = {},
) => {
	return queryOptions({
		queryKey: ["celebrity-matches", input],
		queryFn: ({ signal }) => getCelebrityMatchesApi(input, signal),
	});
};

/**
 * Hook to fetch celebrity matches
 *
 * @example
 * ```tsx
 * const { data: celebrityMatches, isLoading } = useCelebrityMatches();
 * ```
 *
 * @example
 * ```tsx
 * // Filter by category
 * const { data: actors } = useCelebrityMatches({
 *   input: { category: 'actor', limit: 10 }
 * });
 * ```
 */
export const useCelebrityMatches = ({
	input = {},
	queryConfig,
}: {
	input?: GetCelebrityMatchesInput;
	queryConfig?: QueryConfig<typeof getCelebrityMatchesQueryOptions>;
} = {}) => {
	return useQuery({
		...getCelebrityMatchesQueryOptions(input),
		...queryConfig,
	});
};
