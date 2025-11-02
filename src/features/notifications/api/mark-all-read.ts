import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { NotificationsResponse } from "../types";

interface MarkAllReadResponse {
	success: boolean;
	message: string;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
	return api.patch<MarkAllReadResponse>("/notifications/read-all");
}

/**
 * React Query mutation hook for marking all notifications as read with optimistic updates
 */
export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markAllNotificationsRead,
		// Optimistically update the cache before the mutation
		onMutate: async () => {
			// Cancel any outgoing refetches to avoid overwriting our optimistic update
			await queryClient.cancelQueries({ queryKey: ["notifications"] });

			// Snapshot the previous values for rollback
			const previousNotifications =
				queryClient.getQueriesData<NotificationsResponse>({
					queryKey: ["notifications"],
				});

			// Optimistically update all notification queries
			queryClient.setQueriesData<NotificationsResponse>(
				{ queryKey: ["notifications"] },
				(old) => {
					if (!old) return old;

					const now = new Date().toISOString();
					return {
						...old,
						notifications: old.notifications.map((notification) => ({
							...notification,
							read_at: notification.read_at || now,
						})),
						unread_count: 0,
					};
				},
			);

			// Return context with previous data for rollback
			return { previousNotifications };
		},
		// On error, rollback to the previous values
		onError: (_error, _variables, context) => {
			if (context?.previousNotifications) {
				// Restore all previous query states
				context.previousNotifications.forEach(([queryKey, data]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		// Always refetch after error or success to ensure sync with server
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
