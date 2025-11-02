import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { NotificationsResponse } from "../types";

interface ClearAllResponse {
	success: boolean;
	message: string;
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<ClearAllResponse> {
	return api.delete<ClearAllResponse>("/notifications/clear-all");
}

/**
 * React Query mutation hook for clearing all notifications with optimistic updates
 */
export function useClearAllNotifications() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: clearAllNotifications,
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

					return {
						notifications: [],
						total: 0,
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
