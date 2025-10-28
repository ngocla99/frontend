import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
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
export const getBabyListApi = async (
	input: GetBabyListInput = {},
	_signal?: AbortSignal,
): Promise<BabyListItem[]> => {
	const response = await api.get<{
		babies: BabyListItem[];
		total: number;
		skip: number;
		limit: number;
	}>("/baby/list", { params: input });
	return response.babies;
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
