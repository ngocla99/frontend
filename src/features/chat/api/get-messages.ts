import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { GetMessagesParams, MessagesResponse } from "../types";

export const getMessagesApi = async (
	input: GetMessagesParams,
	signal?: AbortSignal,
): Promise<MessagesResponse> => {
	const { connectionId, ...queryParams } = input;
	return api.get<MessagesResponse>(`/messages/${connectionId}`, {
		params: queryParams as Record<
			string,
			string | number | boolean | undefined
		>,
		signal,
	});
};

export const getMessagesQueryOptions = (input: GetMessagesParams) => {
	return queryOptions({
		// Use only connectionId as key for consistency with optimistic updates and realtime
		queryKey: ["messages", input.connectionId],
		queryFn: ({ signal }) => getMessagesApi(input, signal),
		enabled: !!input.connectionId,
		staleTime: 1000 * 10, // 10 seconds
	});
};

type UseMessagesOptions = {
	input: GetMessagesParams;
	queryConfig?: QueryConfig<typeof getMessagesQueryOptions>;
};

export const useMessages = ({ input, queryConfig }: UseMessagesOptions) => {
	return useQuery({
		...getMessagesQueryOptions(input),
		...queryConfig,
	});
};
