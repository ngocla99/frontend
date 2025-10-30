import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Message, SendMessageParams } from "../types";

export async function sendMessage(params: SendMessageParams): Promise<Message> {
	return api.post<Message>("/messages", params);
}

export function useSendMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: sendMessage,
		onSuccess: (data, variables) => {
			// Invalidate messages queries to refetch updated data
			queryClient.invalidateQueries({
				queryKey: ["messages", variables.connection_id],
			});

			// Invalidate connections to update last message
			queryClient.invalidateQueries({ queryKey: ["connections"] });
		},
	});
}
