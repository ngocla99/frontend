/**
 * Presence feature types
 * Defines types for real-time user presence tracking
 */

/**
 * Presence data tracked for each online user
 */
export interface PresenceData {
	user_id: string;
	online_at: string; // ISO 8601 timestamp
}

/**
 * Presence state mapping user IDs to their presence data
 * Key is typically the user_id for easy lookup
 */
export interface PresenceState {
	[key: string]: PresenceData[];
}

/**
 * User presence status (computed from presence data + last_seen)
 */
export interface UserPresenceStatus {
	isOnline: boolean;
	statusText: string; // "Online" or "Last seen X ago"
}

/**
 * Input for updating last_seen timestamp
 */
export interface UpdateLastSeenInput {
	last_seen: string; // ISO 8601 timestamp
}

/**
 * Response from updating last_seen
 */
export interface UpdateLastSeenResponse {
	success: boolean;
	last_seen: string;
}
