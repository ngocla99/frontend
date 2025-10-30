import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../types";

interface UseChatRealtimeOptions {
	connectionId: string;
	enabled?: boolean;
	/**
	 * Optional callback when a new message is received
	 */
	onMessage?: (message: Message) => void;
}

/**
 * Hook for subscribing to real-time message updates for a connection
 * Uses Supabase Realtime with postgres_changes pattern
 * Based on Supabase UI best practices with optimistic updates
 */
export function useChatRealtime({
	connectionId,
	enabled = true,
	onMessage,
}: UseChatRealtimeOptions) {
	const queryClient = useQueryClient();
	const supabase = createClient();

	const handleNewMessage = useCallback(
		(message: Message) => {
			// Optimistically update the messages cache
			queryClient.setQueryData<{ messages: Message[]; has_more: boolean }>(
				["messages", connectionId],
				(old) => {
					if (!old) {
						const newCache = {
							messages: [message],
							has_more: false,
						};
						return newCache;
					}

					// Avoid duplicates (check by ID, ignore temp IDs)
					const exists = old.messages.some(
						(msg) => msg.id === message.id && !msg.id.startsWith("temp-"),
					);

					if (exists) {
						console.log("[Chat Realtime] Message already exists, skipping");
						return old;
					}

					// Remove any pending messages from the same sender with similar content
					const filteredMessages = old.messages.filter(
						(msg) =>
							!(
								msg.pending &&
								msg.sender_id === message.sender_id &&
								msg.content === message.content
							),
					);

					const updatedCache = {
						...old,
						messages: [message, ...filteredMessages],
					};

					return updatedCache;
				},
			);

			// Invalidate connections to update last message preview
			queryClient.invalidateQueries({ queryKey: ["connections"] });

			// Call optional callback
			onMessage?.(message);
		},
		[connectionId, queryClient, onMessage],
	);

	useEffect(() => {
		if (!enabled || !connectionId) return;

		let channel: RealtimeChannel | null = null;

		// Subscribe to new messages for this connection using broadcast pattern
		// This matches how notifications work and ensures real-time delivery
		const subscribeToMessages = async () => {
			channel = supabase
				.channel(`connection:${connectionId}`)
				.on("broadcast", { event: "message" }, ({ payload }) => {
					// Handle incoming broadcast message
					handleNewMessage(payload as Message);
				})
				.subscribe((status) => {
					if (status === "SUBSCRIBED") {
						console.log(
							`[Chat Realtime] ✅ Subscribed to connection: ${connectionId}`,
						);
					} else if (status === "CHANNEL_ERROR") {
						console.error(
							`[Chat Realtime] ❌ Error subscribing to connection: ${connectionId}`,
						);
					} else if (status === "TIMED_OUT") {
						console.error(
							`[Chat Realtime] ⏱️ Subscription timed out for connection: ${connectionId}`,
						);
					} else {
						console.log(
							`[Chat Realtime] Status: ${status} for connection: ${connectionId}`,
						);
					}
				});
		};

		subscribeToMessages();

		// Cleanup function
		return () => {
			if (channel) {
				console.log(
					`[Chat Realtime] 🔌 Unsubscribing from connection: ${connectionId}`,
				);
				supabase.removeChannel(channel);
			}
		};
	}, [connectionId, enabled, supabase, handleNewMessage]);
}
