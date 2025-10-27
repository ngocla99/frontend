import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { Reaction, UserMatchApi } from "@/types/api";
import { transformApiUserMatchesToDisplayData } from "../utils/transform-api-data";
import { useUser } from "@/stores/auth-store";

export type UserMatchInput = {
	userId?: string;
	limit: number;
	offset: number;
	threshold?: number;
	reaction?: Reaction;
	face_id?: string;
	signal?: AbortSignal;
};

export const getUserMatchApi = async (
	input: UserMatchInput,
): Promise<UserMatchApi[]> => {
	const { signal, offset, userId, threshold = 0.5, ...query } = input;
	if (!userId) {
		throw new Error("userId is required");
	}
	const response = await api.get<{ matches: UserMatchApi[]; total: number }>(
		`/matches/user/${userId}`,
		{
			params: { ...query, skip: offset, threshold, limit: input.limit },
		},
	);
	return response.matches;
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
