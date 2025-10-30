import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/features/auth/api/get-me";
import api from "@/lib/api-client";
import type { Message, MessagesResponse, SendMessageParams } from "../types";

export async function sendMessage(params: SendMessageParams): Promise<Message> {
	return api.post<Message>("/messages", params);
}

export function useSendMessage() {
	const queryClient = useQueryClient();
	const currentUser = useUser();

	return useMutation({
		mutationFn: sendMessage,
		onMutate: async (variables) => {
			await queryClient.cancelQueries({
				queryKey: ["messages", variables.connection_id],
			});

			const previousMessages = queryClient.getQueryData<MessagesResponse>([
				"messages",
				variables.connection_id,
			]);

			if (previousMessages && currentUser) {
				const optimisticMessage: Message = {
					id: `temp-${Date.now()}`, // Temporary ID
					local_id: `temp-${Date.now()}`,
					sender_id: currentUser.id,
					sender_name: currentUser.name || "You",
					content: variables.content,
					message_type: variables.message_type || "text",
					read_at: null,
					created_at: new Date().toISOString(),
					pending: true, // Mark as pending for reduced opacity
				};

				const updatedCache = {
					...previousMessages,
					messages: [optimisticMessage, ...previousMessages.messages],
				};

				queryClient.setQueryData<MessagesResponse>(
					["messages", variables.connection_id],
					updatedCache,
				);
			} else {
				console.warn("[Send Message] Cannot add optimistic message:", {
					previousMessages,
					currentUser,
				});
			}

			return { previousMessages };
		},
		// On success, replace pending message with real one
		onSuccess: (data, variables) => {
			const cachedData = queryClient.getQueryData<MessagesResponse>([
				"messages",
				variables.connection_id,
			]);

			if (cachedData) {
				// Remove pending message and add real message
				const updatedMessages = cachedData.messages
					.filter((msg) => !msg.pending) // Remove all pending messages
					.concat({
						...data,
						pending: false,
					});

				// Remove duplicates by ID
				const uniqueMessages = Array.from(
					new Map(updatedMessages.map((msg) => [msg.id, msg])).values(),
				);

				const finalCache = {
					...cachedData,
					messages: uniqueMessages,
				};

				queryClient.setQueryData<MessagesResponse>(
					["messages", variables.connection_id],
					finalCache,
				);
			}

			// Invalidate connections to update last message preview
			queryClient.invalidateQueries({ queryKey: ["connections"] });
		},
		// On error, rollback to previous state
		onError: (error, variables, context) => {
			console.error("[Send Message] Failed to send message:", error);

			if (context?.previousMessages) {
				queryClient.setQueryData(
					["messages", variables.connection_id],
					context.previousMessages,
				);
			}
		},
	});
}
