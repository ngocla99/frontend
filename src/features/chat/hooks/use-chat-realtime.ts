import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../types";

interface UseChatRealtimeOptions {
	connectionId: string;
	enabled?: boolean;
}

/**
 * Hook for subscribing to real-time message updates for a connection
 * Uses Supabase Realtime to listen for new messages
 */
export function useChatRealtime({
	connectionId,
	enabled = true,
}: UseChatRealtimeOptions) {
	const queryClient = useQueryClient();
	const supabase = createClient();

	const handleNewMessage = useCallback(
		(payload: { new: Message }) => {
			// Optimistically update the messages cache
			queryClient.setQueryData<{ messages: Message[] }>(
				["messages", connectionId],
				(old) => {
					if (!old) return { messages: [payload.new] };
					// Avoid duplicates
					const exists = old.messages.some((msg) => msg.id === payload.new.id);
					if (exists) return old;
					return {
						...old,
						messages: [payload.new, ...old.messages],
					};
				},
			);

			// Invalidate connections to update last message
			queryClient.invalidateQueries({ queryKey: ["connections"] });
		},
		[connectionId, queryClient],
	);

	useEffect(() => {
		if (!enabled || !connectionId) return;

		// Subscribe to new messages for this connection
		const channel = supabase
			.channel(`connection:${connectionId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `connection_id=eq.${connectionId}`,
				},
				(payload) => {
					// Safely handle the payload
					if (payload.new) {
						handleNewMessage({ new: payload.new as unknown as Message });
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [connectionId, enabled, supabase, handleNewMessage]);
}
