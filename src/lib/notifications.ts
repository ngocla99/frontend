import type { SupabaseClient } from "@supabase/supabase-js";

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
export type Notification = {
	id: string;
	user_id: string;
	type: NotificationType;
	title: string;
	message: string | null;
	related_id: string | null;
	related_type: RelatedType | null;
	read_at: string | null;
	created_at: string;
};

/**
 * Parameters for creating a notification
 */
export type CreateNotificationParams = {
	user_id: string;
	type: NotificationType;
	title: string;
	message?: string;
	related_id?: string;
	related_type?: RelatedType;
};

/**
 * Create a notification for a user
 *
 * @param supabase - Supabase client
 * @param params - Notification parameters
 * @returns Created notification
 */
export async function createNotification(
	supabase: SupabaseClient,
	params: CreateNotificationParams,
): Promise<Notification> {
	const { data: notification, error } = await supabase
		.from("notifications")
		.insert({
			user_id: params.user_id,
			type: params.type,
			title: params.title,
			message: params.message || null,
			related_id: params.related_id || null,
			related_type: params.related_type || null,
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	return notification;
}

/**
 * Broadcast a notification via Supabase Realtime
 *
 * @param supabase - Supabase client
 * @param userId - User ID to send notification to
 * @param notification - Notification data
 */
export async function broadcastNotification(
	supabase: SupabaseClient,
	userId: string,
	notification: Notification,
): Promise<void> {
	const channel = supabase.channel(`user:${userId}:notifications`);
	await channel.send({
		type: "broadcast",
		event: "notification",
		payload: notification,
	});
}

/**
 * Create and broadcast a notification
 *
 * @param supabase - Supabase client
 * @param params - Notification parameters
 * @returns Created notification
 */
export async function createAndBroadcastNotification(
	supabase: SupabaseClient,
	params: CreateNotificationParams,
): Promise<Notification> {
	// Create notification
	const notification = await createNotification(supabase, params);

	// Broadcast via Realtime
	await broadcastNotification(supabase, params.user_id, notification);

	return notification;
}

/**
 * Get unread notification count for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Unread notification count
 */
export async function getUnreadCount(
	supabase: SupabaseClient,
	userId: string,
): Promise<number> {
	const { count } = await supabase
		.from("notifications")
		.select("*", { count: "exact", head: true })
		.eq("user_id", userId)
		.is("read_at", null);

	return count || 0;
}

/**
 * Mark all notifications as read for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 */
export async function markAllAsRead(
	supabase: SupabaseClient,
	userId: string,
): Promise<void> {
	const { error } = await supabase
		.from("notifications")
		.update({ read_at: new Date().toISOString() })
		.eq("user_id", userId)
		.is("read_at", null);

	if (error) {
		throw error;
	}
}
