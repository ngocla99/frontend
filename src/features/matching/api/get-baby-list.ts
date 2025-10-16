import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";

// Types
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

// API Function
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

// Query Options
export const getBabyListQueryOptions = (input: GetBabyListInput = {}) => {
	return queryOptions({
		queryKey: ["baby", "list", input],
		queryFn: ({ signal }) => getBabyListApi(input, signal),
	});
};

// Hooks
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
