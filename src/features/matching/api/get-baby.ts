import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

export const getBabyForMatchApi = (matchId: string): Promise<BabyApi> => {
	return apiClient.get("/api/v1/baby", {
		params: { match_id: matchId },
	});
};

export const getBabyForMatchQueryOptions = (matchId: string) => {
	return queryOptions({
		queryKey: ["baby", "match", matchId],
		queryFn: () => getBabyForMatchApi(matchId),
		enabled: !!matchId,
	});
};

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
