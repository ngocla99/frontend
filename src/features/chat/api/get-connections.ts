import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { ConnectionsResponse, GetConnectionsParams } from "../types";

export const getConnectionsApi = async (
	input: GetConnectionsParams = {},
	signal?: AbortSignal,
): Promise<ConnectionsResponse> => {
	return api.get<ConnectionsResponse>("/connections", {
		params: input as Record<string, string | number | boolean | undefined>,
		signal,
	});
};

export const getConnectionsQueryOptions = (
	input: GetConnectionsParams = {},
) => {
	return queryOptions({
		queryKey: ["connections", input],
		queryFn: ({ signal }) => getConnectionsApi(input, signal),
		staleTime: 1000 * 30, // 30 seconds
	});
};

type UseConnectionsOptions = {
	input?: GetConnectionsParams;
	queryConfig?: QueryConfig<typeof getConnectionsQueryOptions>;
};

export const useConnections = ({
	input = {},
	queryConfig,
}: UseConnectionsOptions = {}) => {
	return useQuery({
		...getConnectionsQueryOptions(input),
		...queryConfig,
	});
};
