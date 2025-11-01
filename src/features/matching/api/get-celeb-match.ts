import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { CelebMatchApi, Reaction } from "@/types/api";
import { transformApiCelebMatchesToDisplayData } from "../utils/transform-api-data";

export type CelebMatchInput = {
	faceId?: string; // Optional - defaults to user's default_face_id
	limit?: number;
	category?: string; // Filter by category: 'actor', 'musician', 'athlete', 'influencer'
	reaction?: Reaction;
	signal?: AbortSignal;
};

export const getCelebMatchApi = async (
	input: CelebMatchInput,
): Promise<CelebMatchApi[]> => {
	const { signal, faceId, limit, category } = input;
	const params: Record<string, string | number> = {};

	if (faceId) params.face_id = faceId;
	if (limit) params.limit = limit;
	if (category) params.category = category;

	const response = await api.get<{
		matches: CelebMatchApi[];
		total: number;
	}>("/matches/celebrity", {
		params,
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
