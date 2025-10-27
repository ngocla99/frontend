import {
	queryOptions,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import api from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { LiveMatchApi } from "@/types/api";
import { transformApiMatchesToDisplayData } from "../utils/transform-api-data";

export type LiveMatchInput = {
	limit: number;
	skip: number;
	signal?: AbortSignal;
};

export const getLiveMatchApi = async (
	input: LiveMatchInput,
): Promise<LiveMatchApi[]> => {
	const { signal, ...query } = input;
	const response = await api.get<{ matches: LiveMatchApi[]; total: number }>(
		"/matches/top",
		{
			params: query,
		},
	);
	return response.matches;
};

export const getLiveMatchQueryOptions = (input: LiveMatchInput) => {
	return queryOptions({
		queryKey: ["matching", "top", input],
		queryFn: () => getLiveMatchApi(input),
	});
};

type UseLiveMatchOptions = {
	queryConfig?: QueryConfig<typeof getLiveMatchQueryOptions>;
	input?: LiveMatchInput;
};

export const useLiveMatch = ({
	input = {
		skip: PAGINATION.DEFAULT_OFFSET,
		limit: PAGINATION.DEFAULT_LIMIT,
	},
	queryConfig,
}: UseLiveMatchOptions = {}) => {
	return useQuery({
		...getLiveMatchQueryOptions(input),
		...queryConfig,
	});
};

type UseLiveMatchInfiniteOptions = {
	input?: LiveMatchInput;
	queryConfig?: QueryConfig<typeof getLiveMatchApi>;
};

export const useLiveMatchInfinite = ({
	input = {
		skip: PAGINATION.DEFAULT_OFFSET,
		limit: PAGINATION.DEFAULT_LIMIT,
	},
	queryConfig,
}: UseLiveMatchInfiniteOptions = {}) => {
	return useInfiniteQuery({
		queryKey: ["matching", "top", "infinite"],
		queryFn: ({ pageParam = PAGINATION.DEFAULT_OFFSET, signal }) =>
			getLiveMatchApi({
				...input,
				skip: pageParam,
				signal,
			}),
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.length === 0) {
				return undefined;
			}
			return lastPageParam + input.limit;
		},
		initialPageParam: PAGINATION.DEFAULT_OFFSET,
		select: (data) => {
			return data.pages.flatMap((page) => {
				return transformApiMatchesToDisplayData(page);
			});
		},
		...queryConfig,
	});
};
