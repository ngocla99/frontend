import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";

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
 * React Query mutation hook for marking notification as read
 */
export function useMarkNotificationRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markNotificationRead,
		onSuccess: () => {
			// Invalidate notifications queries to refetch updated data
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
