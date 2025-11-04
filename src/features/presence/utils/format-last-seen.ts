/**
 * Format last seen timestamp to human-readable text
 * Examples: "Last seen just now", "Last seen 5m ago", "Last seen 2h ago"
 */
export function formatLastSeen(lastSeenISO: string): string {
	const now = new Date();
	const lastSeen = new Date(lastSeenISO);
	const diffMs = now.getTime() - lastSeen.getTime();

	// Handle invalid or future dates
	if (isNaN(diffMs) || diffMs < 0) {
		return "Offline";
	}

	const diffMins = Math.floor(diffMs / 60000);

	// Just now (< 1 minute)
	if (diffMins < 1) {
		return "Last seen just now";
	}

	// Minutes (1-59 minutes)
	if (diffMins < 60) {
		return `Last seen ${diffMins}m ago`;
	}

	// Hours (1-23 hours)
	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) {
		return `Last seen ${diffHours}h ago`;
	}

	// Days (1-6 days)
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) {
		return `Last seen ${diffDays}d ago`;
	}

	// More than a week - show date
	return `Last seen ${lastSeen.toLocaleDateString()}`;
}
