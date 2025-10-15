import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
	return apiClient.post(`/api/v1/baby`, { match_id: matchId });
};

export const getBabyForMatchApi = (
	matchId: string,
	signal?: AbortSignal,
): Promise<BabyApi> => {
	// Backend expects GET with JSON body (unconventional but that's the API design)
	// Using Axios request method to properly send body with GET
	return apiClient.request({
		method: "GET",
		url: "/api/v1/baby",
		data: { match_id: matchId },
		signal,
	});
};

// Query Options
export const getBabyForMatchQueryOptions = (matchId: string) => {
	return queryOptions({
		queryKey: ["baby", "match", matchId],
		queryFn: ({ signal }) => getBabyForMatchApi(matchId, signal),
		enabled: !!matchId,
		retry: false, // Don't retry if baby doesn't exist yet
	});
};

// Hooks
type UseBabyForMatchOptions = {
	matchId?: string;
	queryConfig?: QueryConfig<typeof getBabyForMatchQueryOptions>;
};

export const useBabyForMatch = ({
	matchId,
	queryConfig,
}: UseBabyForMatchOptions = {}) => {
	return useQuery({
		...getBabyForMatchQueryOptions(matchId || ""),
		...queryConfig,
	});
};

export const useGenerateBaby = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: generateBabyApi,
		onSuccess: (data, matchId) => {
			queryClient.setQueryData(["baby", "match", matchId], data);
			queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
		},
	});
};

// Baby List API
export type BabyListItem = {
	id: string; // match_id
	me: {
		id: string;
		name: string;
		image: string;
		school: string;
	};
	other: {
		id: string;
		name: string;
		image: string;
		school: string;
	};
	created_at: string;
	images: Array<{
		id: string;
		image_url: string;
	}>;
};

export type GetBabyListInput = {
	userId?: string;
	skip?: number;
	limit?: number;
};

export const getBabyListApi = (
	input: GetBabyListInput = {},
	signal?: AbortSignal,
): Promise<BabyListItem[]> => {
	const params = new URLSearchParams();
	if (input.userId) params.append("user_id", input.userId);
	if (input.skip !== undefined) params.append("skip", String(input.skip));
	if (input.limit !== undefined) params.append("limit", String(input.limit));

	const queryString = params.toString();
	const url = queryString
		? `/api/v1/me/babies?${queryString}`
		: "/api/v1/me/babies";

	return apiClient.get(url, { signal });
};

export const getBabyListQueryOptions = (input: GetBabyListInput = {}) => {
	return queryOptions({
		queryKey: ["baby", "list", input],
		queryFn: ({ signal }) => getBabyListApi(input, signal),
	});
};

type UseBabyListOptions = {
	input?: GetBabyListInput;
	queryConfig?: QueryConfig<typeof getBabyListQueryOptions>;
};

export const useBabyList = ({
	input = {},
	queryConfig,
}: UseBabyListOptions = {}) => {
	return useQuery({
		...getBabyListQueryOptions(input),
		...queryConfig,
	});
};
