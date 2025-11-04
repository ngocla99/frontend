"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/features/auth/api/get-me";
import { cn } from "@/lib/utils";
import { useMessages } from "../api/get-messages";
import { useSendMessage } from "../api/send-message";
import { useChatRealtime } from "../hooks/use-chat-realtime";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatRoomProps {
	connectionId: string;
	connection: {
		id: string;
		other_user: {
			id: string;
			name: string;
			profile_image: string | null;
			last_seen?: string | null;
		};
		baby_image: string | null;
	};
	onBack?: () => void;
	className?: string;
}

export function ChatRoom({
	connectionId,
	connection,
	onBack,
	className,
}: ChatRoomProps) {
	const router = useRouter();
	const user = useUser();
	const [isSending, setIsSending] = useState(false);

	// Fetch messages
	const { data: messagesData, isLoading } = useMessages({
		input: { connectionId },
	});

	// Real-time subscription
	useChatRealtime({ connectionId, enabled: true });

	// Send message mutation
	const sendMessageMutation = useSendMessage();

	const messages = messagesData?.messages || [];
	const hasNextPage = messagesData?.has_more || false;

	const handleSendMessage = async (content: string) => {
		if (!user?.id || isSending) return;

		setIsSending(true);
		try {
			await sendMessageMutation.mutateAsync({
				connection_id: connectionId,
				content,
				message_type: "text",
			});
		} catch (error) {
			console.error("Failed to send message:", error);
			toast.error("Failed to send message. Please try again.");
		} finally {
			setIsSending(false);
		}
	};

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			router.push("/chat");
		}
	};

	return (
		<div className={cn("flex flex-col h-full dark:bg-gray-900", className)}>
			<ChatHeader
				otherUser={connection.other_user}
				babyImage={connection.baby_image}
				onBack={handleBack}
			/>

			<MessageList
				messages={messages}
				isLoading={isLoading}
				hasMore={hasNextPage}
				onLoadMore={() => {
					// TODO: Implement pagination with cursor
					console.log("Load more messages");
				}}
			/>

			<MessageInput
				onSend={handleSendMessage}
				disabled={isSending}
				placeholder={`Message ${connection.other_user.name}...`}
			/>
		</div>
	);
}
