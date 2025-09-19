import {
	queryOptions,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";

export type LiveMatchInput = {
	limit: number;
	offset: number;
};

export const getLiveMatchApi = (input: LiveMatchInput): Promise<any> => {
	return apiClient.get("/api/v1/matching/top", {
		params: input,
	});
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
		offset: PAGINATION.DEFAULT_OFFSET,
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
	queryConfig?: QueryConfig<any>;
};

export const useLiveMatchInfinite = ({
	input = {
		offset: PAGINATION.DEFAULT_OFFSET,
		limit: PAGINATION.DEFAULT_LIMIT,
	},
	queryConfig,
}: UseLiveMatchInfiniteOptions = {}) => {
	return useInfiniteQuery({
		queryKey: ["matching", "top", "infinite", input],
		queryFn: ({ pageParam = PAGINATION.DEFAULT_OFFSET }) =>
			getLiveMatchApi({
				...input,
				offset: pageParam,
			}),
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.length === 0) {
				return undefined;
			}
			return lastPageParam + input.limit;
		},
		initialPageParam: PAGINATION.DEFAULT_OFFSET,
		select: (data) => {
			return data.pages.flat();
		},
		...queryConfig,
	});
};
