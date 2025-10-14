import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { CelebMatchApi, Reaction } from "@/types/api";
import { transformApiCelebMatchesToDisplayData } from "../utils/transform-api-data";

export type CelebMatchInput = {
	limit: number;
	offset: number;
	reaction?: Reaction;
	face_id?: string;
	signal?: AbortSignal;
};

export const getCelebMatchApi = (
	input: CelebMatchInput,
): Promise<CelebMatchApi[]> => {
	const { signal, ...query } = input;
	return apiClient.get("/api/v1/me/matches", {
		params: { ...query, filter: "celeb" },
		signal,
	});
};

export const getCelebMatchQueryOptions = (
	input = {
		limit: 50,
		offset: PAGINATION.DEFAULT_OFFSET,
	},
) => {
	return queryOptions({
		queryKey: ["matching", "celeb", input],
		queryFn: ({ signal }) => getCelebMatchApi({ ...input, signal }),
	});
};

type UseCelebMatchOptions = {
	queryConfig?: QueryConfig<typeof getCelebMatchQueryOptions>;
	input?: CelebMatchInput;
};

export const useCelebMatch = ({
	input,
	queryConfig,
}: UseCelebMatchOptions = {}) => {
	return useQuery({
		...getCelebMatchQueryOptions(input),
		...queryConfig,
		select: (data) => transformApiCelebMatchesToDisplayData(data),
	});
};
