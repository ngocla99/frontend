"use client";

import { use } from "react";
import { ChatContainer } from "@/features/chat/components/chat-container";

interface ChatRoomPageProps {
	params: Promise<{
		connectionId: string;
	}>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
	const { connectionId } = use(params);

	return <ChatContainer defaultConnectionId={connectionId} />;
}
