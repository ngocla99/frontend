"use client";

import type { Message } from "../types";
import { ChatMessage } from "./ui/chat-message";

interface MessageItemProps {
	message: Message;
	isOwn: boolean;
}

/**
 * MessageItem component - Wrapper around ChatMessage for backwards compatibility
 * Uses the new Supabase UI component pattern
 */
export function MessageItem({ message, isOwn }: MessageItemProps) {
	return (
		<ChatMessage
			content={message.content}
			createdAt={message.created_at}
			isOwn={isOwn}
			messageType={message.message_type}
			showTimestamp
			pending={message.pending}
		/>
	);
}
