import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

export const getBabyForMatchApi = async (matchId: string): Promise<BabyApi | null> => {
	const response = await api.get<{ baby: BabyApi | null }>("/baby", {
		params: { match_id: matchId },
	});
	return response.baby;
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
