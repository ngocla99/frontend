import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { Reaction, UserMatchApi } from "@/types/api";
import { transformApiUserMatchesToDisplayData } from "../utils/transform-api-data";

export type UserMatchInput = {
	faceId: string;
	matchType?: "user" | "celebrity" | "all";
	limit: number;
	offset: number;
	reaction?: Reaction;
	signal?: AbortSignal;
};

export const getUserMatchApi = async (
	input: UserMatchInput,
): Promise<UserMatchApi[]> => {
	const { signal, offset, faceId, matchType = "all", ...query } = input;

	const response = await api.get<{ matches: UserMatchApi[]; total: number }>(
		"/matches/for-image",
		{
			params: {
				...query,
				face_id: faceId,
				match_type: matchType,
				skip: offset,
				limit: input.limit,
			},
			signal,
		},
	);
	return response.matches;
};

export const getUserMatchQueryOptions = (input: UserMatchInput) => {
	return queryOptions({
		queryKey: ["matching", "user", input],
		queryFn: ({ signal }) => getUserMatchApi({ ...input, signal }),
	});
};

type UseUserMatchOptions = {
	queryConfig?: QueryConfig<typeof getUserMatchQueryOptions>;
	input: UserMatchInput;
};

export const useUserMatch = ({ input, queryConfig }: UseUserMatchOptions) => {
	return useQuery({
		...getUserMatchQueryOptions(input),
		...queryConfig,
		select: (data) => transformApiUserMatchesToDisplayData(data),
	});
};
