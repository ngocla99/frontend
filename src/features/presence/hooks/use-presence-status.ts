import { useMemo } from "react";
import { useIsUserOnline } from "../store/presence-store";
import type { UserPresenceStatus } from "../types";
import { formatLastSeen } from "../utils/format-last-seen";

/**
 * Hook to get formatted presence status for a user
 * Combines real-time online status from store with last_seen timestamp from database
 *
 * @param userId - User ID to check presence for
 * @param lastSeen - Last seen timestamp (ISO 8601) from database
 * @returns Object with isOnline boolean and formatted status text
 */
export function usePresenceStatus(
	userId: string,
	lastSeen: string | null | undefined,
): UserPresenceStatus {
	// Get online status from global presence store
	const isOnline = useIsUserOnline(userId);

	const statusText = useMemo(() => {
		// If online, show "Online"
		if (isOnline) {
			return "Online";
		}

		// If not online and no last_seen, show "Offline"
		if (!lastSeen) {
			return "Offline";
		}

		// Format last_seen timestamp
		return formatLastSeen(lastSeen);
	}, [isOnline, lastSeen]);

	return {
		isOnline,
		statusText,
	};
}
