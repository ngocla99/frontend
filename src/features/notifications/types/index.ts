/**
 * Notification types
 */
export type NotificationType =
	| "baby_generated"
	| "mutual_match"
	| "new_message";

/**
 * Related entity types
 */
export type RelatedType = "baby" | "match" | "message" | "connection";

/**
 * Notification data structure
 */
export interface Notification {
	id: string;
	user_id: string;
	type: NotificationType;
	title: string;
	message: string | null;
	related_id: string | null;
	related_type: RelatedType | null;
	read_at: string | null;
	created_at: string;
}

/**
 * API response for notifications list
 */
export interface NotificationsResponse {
	notifications: Notification[];
	total: number;
	unread_count: number;
}

/**
 * Parameters for fetching notifications
 */
export interface GetNotificationsParams {
	unread_only?: boolean;
	limit?: number;
	offset?: number;
}
