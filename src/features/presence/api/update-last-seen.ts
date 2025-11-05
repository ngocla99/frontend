import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { UpdateLastSeenInput, UpdateLastSeenResponse } from "../types";

/**
 * Update the current user's last_seen timestamp
 * This is called when the user disconnects or closes the app
 */
export async function updateLastSeen(
	input: UpdateLastSeenInput,
): Promise<UpdateLastSeenResponse> {
	return api.patch<UpdateLastSeenResponse>("/presence", input);
}

/**
 * Hook to update last_seen timestamp
 * Used when user disconnects from presence channel
 */
export function useUpdateLastSeen() {
	return useMutation({
		mutationFn: updateLastSeen,
		onError: (error) => {
			console.error("[Presence] Failed to update last_seen:", error);
		},
	});
}
