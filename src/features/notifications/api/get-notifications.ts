import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { GetNotificationsParams, NotificationsResponse } from "../types";

export const getNotificationsApi = async (
	input: GetNotificationsParams = {},
	signal?: AbortSignal,
): Promise<NotificationsResponse> => {
	const searchParams = new URLSearchParams();

	if (input.unread_only !== undefined) {
		searchParams.append("unread_only", String(input.unread_only));
	}
	if (input.limit !== undefined) {
		searchParams.append("limit", String(input.limit));
	}
	if (input.offset !== undefined) {
		searchParams.append("offset", String(input.offset));
	}

	return api.get<NotificationsResponse>(
		`/notifications?${searchParams.toString()}`,
		{ signal },
	);
};

export const getNotificationsQueryOptions = (
	input: GetNotificationsParams = {},
) => {
	return queryOptions({
		queryKey: ["notifications", input],
		queryFn: ({ signal }) => getNotificationsApi(input, signal),
		staleTime: 1000 * 30, // 30 seconds
	});
};

type UseNotificationsOptions = {
	input?: GetNotificationsParams;
	queryConfig?: QueryConfig<typeof getNotificationsQueryOptions>;
};

export const useNotifications = ({
	input = {},
	queryConfig,
}: UseNotificationsOptions = {}) => {
	return useQuery({
		...getNotificationsQueryOptions(input),
		...queryConfig,
	});
};

export const useUnreadNotifications = ({
	queryConfig,
}: Omit<UseNotificationsOptions, "input"> = {}) => {
	return useNotifications({ input: { unread_only: true }, queryConfig });
};
