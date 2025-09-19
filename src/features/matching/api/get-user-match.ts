import {
	queryOptions,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { LiveMatchApi } from "@/types/api";
import { transformApiMatchesToCardData } from "../utils/transform-api-data";

export type UserMatchInput = {
	limit: number;
	offset: number;
};

export const getUserMatchApi = (
	input: UserMatchInput,
): Promise<LiveMatchApi[]> => {
	return apiClient.get("/api/v1/me/matches", {
		params: input,
	});
};

export const getUserMatchQueryOptions = (input: UserMatchInput) => {
	return queryOptions({
		queryKey: ["matching", "user", input],
		queryFn: () => getUserMatchApi(input),
	});
};

type UseUserMatchOptions = {
	queryConfig?: QueryConfig<typeof getUserMatchQueryOptions>;
	input?: UserMatchInput;
};

export const useUserMatch = ({
	input = {
		limit: 50,
		offset: PAGINATION.DEFAULT_OFFSET,
	},
	queryConfig,
}: UseUserMatchOptions = {}) => {
	return useQuery({
		...getUserMatchQueryOptions(input),
		...queryConfig,
	});
};
