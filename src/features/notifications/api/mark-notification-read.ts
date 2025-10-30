import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { NotificationsResponse } from "../types";

interface MarkReadResponse {
	id: string;
	read_at: string;
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
	notificationId: string,
): Promise<MarkReadResponse> {
	return api.patch<MarkReadResponse>(
		`/notifications/${notificationId}/read`,
	);
}

/**
 * React Query mutation hook for marking notification as read with optimistic updates
 */
export function useMarkNotificationRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markNotificationRead,
		// Optimistically update the cache before the mutation
		onMutate: async (notificationId: string) => {
			// Cancel any outgoing refetches to avoid overwriting our optimistic update
			await queryClient.cancelQueries({ queryKey: ["notifications"] });

			// Snapshot the previous values for rollback
			const previousNotifications = queryClient.getQueriesData<NotificationsResponse>({
				queryKey: ["notifications"],
			});

			// Optimistically update all notification queries
			queryClient.setQueriesData<NotificationsResponse>(
				{ queryKey: ["notifications"] },
				(old) => {
					if (!old) return old;

					return {
						...old,
						notifications: old.notifications.map((notification) =>
							notification.id === notificationId
								? {
										...notification,
										read_at: new Date().toISOString(),
									}
								: notification,
						),
						// Decrease unread count if the notification was unread
						unread_count: Math.max(
							0,
							old.unread_count -
								(old.notifications.find((n) => n.id === notificationId)?.read_at
									? 0
									: 1),
						),
					};
				},
			);

			// Return context with previous data for rollback
			return { previousNotifications };
		},
		// On error, rollback to the previous values
		onError: (_error, _notificationId, context) => {
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
