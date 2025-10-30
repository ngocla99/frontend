"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/features/auth/api/get-me";
import { cn } from "@/lib/utils";
import { useChatRealtime, useMessages, useSendMessage } from "../hooks";
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
		};
		baby_image: string | null;
	};
	/**
	 * Whether the component is embedded in a two-column layout
	 */
	embedded?: boolean;
	/**
	 * Custom onBack handler (optional)
	 */
	onBack?: () => void;
	/**
	 * Custom class name for the container
	 */
	className?: string;
}

export function ChatRoom({
	connectionId,
	connection,
	embedded = false,
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

	const handleArchive = () => {
		toast.info("Archive feature coming soon!");
	};

	const handleBlock = () => {
		toast.info("Block feature coming soon!");
	};

	return (
		<div
			className={cn(
				"flex flex-col h-screen bg-gray-50 dark:bg-gray-900",
				className,
			)}
		>
			<ChatHeader
				otherUser={connection.other_user}
				babyImage={connection.baby_image}
				onBack={embedded ? undefined : handleBack}
				onArchive={handleArchive}
				onBlock={handleBlock}
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
