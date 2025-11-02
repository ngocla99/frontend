import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { NotificationsResponse } from "../types";

interface DeleteNotificationResponse {
	success: boolean;
	message: string;
}

/**
 * Delete a specific notification
 */
export async function deleteNotification(
	notificationId: string,
): Promise<DeleteNotificationResponse> {
	return api.delete<DeleteNotificationResponse>(
		`/notifications/${notificationId}`,
	);
}

/**
 * React Query mutation hook for deleting a notification with optimistic updates
 */
export function useDeleteNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteNotification,
		// Optimistically update the cache before the mutation
		onMutate: async (notificationId: string) => {
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

					const deletedNotification = old.notifications.find(
						(n) => n.id === notificationId,
					);
					const wasUnread = deletedNotification?.read_at === null;

					return {
						...old,
						notifications: old.notifications.filter(
							(notification) => notification.id !== notificationId,
						),
						total: Math.max(0, old.total - 1),
						unread_count: wasUnread
							? Math.max(0, old.unread_count - 1)
							: old.unread_count,
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
