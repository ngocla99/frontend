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

/**
 * Update or create a new_message notification
 * If an existing unread new_message notification exists from the same connection,
 * update it instead of creating a new one
 *
 * @param supabase - Supabase client
 * @param params - Notification parameters
 * @param connectionId - Connection ID to check for existing notifications
 * @returns Updated or created notification
 */
export async function updateOrCreateMessageNotification(
	supabase: SupabaseClient,
	params: CreateNotificationParams,
	connectionId: string,
): Promise<Notification> {
	// Find existing unread new_message notification for this connection
	const { data: existingNotifications } = await supabase
		.from("notifications")
		.select("*")
		.eq("user_id", params.user_id)
		.eq("type", "new_message")
		// .is("read_at", null)
		.order("created_at", { ascending: false });

	// Check if there's an existing notification from this connection
	// We need to get messages to find which notifications belong to this connection
	let existingNotification: Notification | null = null;

	if (existingNotifications && existingNotifications.length > 0) {
		// Get all message IDs from existing notifications
		const messageIds = existingNotifications
			.map((n) => n.related_id)
			.filter(Boolean);

		if (messageIds.length > 0) {
			// Check which messages belong to this connection
			const { data: messages } = await supabase
				.from("messages")
				.select("id, connection_id")
				.in("id", messageIds)
				.eq("connection_id", connectionId);

			if (messages && messages.length > 0) {
				// Find the first notification that matches a message from this connection
				const messageIdSet = new Set(messages.map((m) => m.id));
				existingNotification =
					existingNotifications.find((n) => messageIdSet.has(n.related_id)) ||
					null;
			}
		}
	}

	if (existingNotification) {
		// Update existing notification
		const { data: updatedNotification, error } = await supabase
			.from("notifications")
			.update({
				title: params.title,
				message: params.message || null,
				related_id: params.related_id || null,
				created_at: new Date().toISOString(), // Update timestamp to show latest message time
				read_at: null, // Mark as unread
			})
			.eq("id", existingNotification.id)
			.select()
			.single();

		if (error) {
			throw error;
		}

		// Broadcast updated notification
		await broadcastNotification(supabase, params.user_id, updatedNotification);

		return updatedNotification;
	}

	// No existing notification, create new one
	return createAndBroadcastNotification(supabase, params);
}
