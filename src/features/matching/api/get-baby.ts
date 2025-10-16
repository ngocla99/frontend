import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

export const getBabyForMatchApi = (
	matchId: string,
	signal?: AbortSignal,
): Promise<BabyApi> => {
	// Backend expects GET with JSON body (unconventional but that's the API design)
	// Using Axios request method to properly send body with GET
	return apiClient.request({
		method: "GET",
		url: "/api/v1/baby",
		data: { match_id: matchId },
		signal,
	});
};

// Query Options
export const getBabyForMatchQueryOptions = (matchId: string) => {
	return queryOptions({
		queryKey: ["baby", "match", matchId],
		queryFn: ({ signal }) => getBabyForMatchApi(matchId, signal),
		enabled: !!matchId,
		retry: false, // Don't retry if baby doesn't exist yet
	});
};

// Hooks
type UseBabyForMatchOptions = {
	matchId?: string;
	queryConfig?: QueryConfig<typeof getBabyForMatchQueryOptions>;
};

export const useBabyForMatch = ({
	matchId,
	queryConfig,
}: UseBabyForMatchOptions = {}) => {
	return useQuery({
		...getBabyForMatchQueryOptions(matchId || ""),
		...queryConfig,
	});
};
