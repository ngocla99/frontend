import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { Reaction, UserMatchApi } from "@/types/api";
import { transformApiUserMatchesToDisplayData } from "../utils/transform-api-data";

export type UserMatchInput = {
	limit: number;
	offset: number;
	reaction?: Reaction;
	signal?: AbortSignal;
};

export const getUserMatchApi = (
	input: UserMatchInput,
): Promise<UserMatchApi[]> => {
	const { signal, ...query } = input;
	return apiClient.get("/api/v1/me/matches", {
		params: { ...query, filter: "user" },
		signal,
	});
};

export const getUserMatchQueryOptions = (
	input = {
		limit: 50,
		offset: PAGINATION.DEFAULT_OFFSET,
	},
) => {
	return queryOptions({
		queryKey: ["matching", "user", input],
		queryFn: ({ signal }) => getUserMatchApi({ ...input, signal }),
	});
};

type UseUserMatchOptions = {
	queryConfig?: QueryConfig<typeof getUserMatchQueryOptions>;
	input?: UserMatchInput;
};

export const useUserMatch = ({
	input,
	queryConfig,
}: UseUserMatchOptions = {}) => {
	return useQuery({
		...getUserMatchQueryOptions(input),
		...queryConfig,
		select: (data) => transformApiUserMatchesToDisplayData(data),
	});
};
