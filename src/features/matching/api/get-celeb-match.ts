import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { CelebMatchApi, Reaction } from "@/types/api";
import { transformApiCelebMatchesToDisplayData } from "../utils/transform-api-data";

export type CelebMatchInput = {
	faceId: string;
	limit: number;
	offset: number;
	reaction?: Reaction;
	signal?: AbortSignal;
};

export const getCelebMatchApi = async (
	input: CelebMatchInput,
): Promise<CelebMatchApi[]> => {
	const { signal, faceId, limit, offset } = input;
	const response = await api.get<{
		matches: CelebMatchApi[];
		total: number;
	}>("/matches/for-image", {
		params: {
			face_id: faceId,
			match_type: "celebrity",
			limit,
			skip: offset,
		},
		signal,
	});
	return response.matches;
};

export const getCelebMatchQueryOptions = (input: CelebMatchInput) => {
	return queryOptions({
		queryKey: ["matching", "celeb", input],
		queryFn: ({ signal }) => getCelebMatchApi({ ...input, signal }),
	});
};

type UseCelebMatchOptions = {
	queryConfig?: QueryConfig<typeof getCelebMatchQueryOptions>;
	input: CelebMatchInput;
};

export const useCelebMatch = ({ input, queryConfig }: UseCelebMatchOptions) => {
	return useQuery({
		...getCelebMatchQueryOptions(input),
		...queryConfig,
		select: (data) => transformApiCelebMatchesToDisplayData(data),
	});
};
