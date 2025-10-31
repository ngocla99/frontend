/** biome-ignore-all lint/suspicious/noImplicitAnyLet: no neec check */
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/notifications
 * Fetch user's notifications (paginated, unread first)
 *
 * Query params:
 * - unread_only?: boolean (default: false)
 * - limit?: number (default: 50, max: 100)
 * - offset?: number (default: 0)
 */
export const GET = withSession(async ({ supabase, session, searchParams }) => {
	try {
		const unreadOnly = searchParams.unread_only === "true";
		const limit = Math.min(Number(searchParams.limit) || 50, 100);
		const offset = Number(searchParams.offset) || 0;

		// Build query for notifications
		let query = supabase
			.from("notifications")
			.select("*", { count: "exact" })
			.eq("user_id", session.user.id)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		// Filter for unread only if requested
		if (unreadOnly) {
			query = query.is("read_at", null);
		}

		const { data: notifications, error, count } = await query;

		if (error) {
			throw error;
		}

		// Get unread count
		const { count: unreadCount } = await supabase
			.from("notifications")
			.select("*", { count: "exact", head: true })
			.eq("user_id", session.user.id)
			.is("read_at", null);

		return NextResponse.json({
			notifications: notifications || [],
			total: count || 0,
			unread_count: unreadCount || 0,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * POST /api/notifications
 * Create a new notification for a user
 *
 * Body:
 * {
 *   user_id: string;
 *   type: 'baby_generated' | 'mutual_match' | 'new_message';
 *   title: string;
 *   message?: string;
 *   related_id?: string;
 *   related_type?: 'baby' | 'match' | 'message' | 'connection';
 * }
 */
export const POST = withSession(async ({ request, supabase }) => {
	try {
		const body = await request.json();

		const { user_id, type, title, message, related_id, related_type } = body;

		// Validate required fields
		if (!user_id || !type || !title) {
			return NextResponse.json(
				{ error: "Missing required fields: user_id, type, title" },
				{ status: 400 },
			);
		}

		// Validate type
		const validTypes = ["baby_generated", "mutual_match", "new_message"];
		if (!validTypes.includes(type)) {
			return NextResponse.json(
				{ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
				{ status: 400 },
			);
		}

		// Validate related_type if provided
		if (related_type) {
			const validRelatedTypes = ["baby", "match", "message", "connection"];
			if (!validRelatedTypes.includes(related_type)) {
				return NextResponse.json(
					{
						error: `Invalid related_type. Must be one of: ${validRelatedTypes.join(", ")}`,
					},
					{ status: 400 },
				);
			}
		}

		let notification;
		let error;

		// For new_message type, update existing notification from same sender instead of creating new one
		if (type === "new_message" && related_id) {
			// Check if there's an existing unread notification from this sender
			const { data: existing } = await supabase
				.from("notifications")
				.select("id")
				.eq("user_id", user_id)
				.eq("type", "new_message")
				.eq("related_id", related_id)
				.is("read_at", null)
				.single();

			if (existing) {
				// Update existing notification
				const result = await supabase
					.from("notifications")
					.update({
						title,
						message: message || null,
						created_at: new Date().toISOString(), // Update timestamp to keep it fresh
					})
					.eq("id", existing.id)
					.select()
					.single();

				notification = result.data;
				error = result.error;
			} else {
				// Insert new notification
				const result = await supabase
					.from("notifications")
					.insert({
						user_id,
						type,
						title,
						message: message || null,
						related_id: related_id || null,
						related_type: related_type || null,
					})
					.select()
					.single();

				notification = result.data;
				error = result.error;
			}
		} else {
			// Insert notification for other types
			const result = await supabase
				.from("notifications")
				.insert({
					user_id,
					type,
					title,
					message: message || null,
					related_id: related_id || null,
					related_type: related_type || null,
				})
				.select()
				.single();

			notification = result.data;
			error = result.error;
		}

		if (error) {
			throw error;
		}

		// Broadcast notification via Realtime
		const channel = supabase.channel(`user:${user_id}:notifications`);
		await channel.send({
			type: "broadcast",
			event: "notification",
			payload: notification,
		});

		return NextResponse.json(notification, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
});
