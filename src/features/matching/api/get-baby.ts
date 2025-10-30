import { queryOptions, useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/auth/api/get-me";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "../types";

export const getBabyForMatchApi = async (
	matchId: string,
): Promise<BabyApi | null> => {
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
	const user = useUser();

	return useQuery({
		...getBabyForMatchQueryOptions(matchId || ""),
		...queryConfig,
		staleTime: 0,
		select: (baby) => {
			// TODO: can remove the filter by user id later
			if (user?.id === baby?.generated_by_profile_id) return baby;
			return null;
		},
	});
};
