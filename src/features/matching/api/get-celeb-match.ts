import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
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

export const getCelebMatchApi = async (
	input: CelebMatchInput,
): Promise<CelebMatchApi[]> => {
	const { signal, face_id, limit, ...rest } = input;
	const response = await api.post<{
		celebrities: CelebMatchApi[];
		total: number;
	}>("/matches/celebrity", {
		face_id,
		limit,
	});
	return response.celebrities;
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
