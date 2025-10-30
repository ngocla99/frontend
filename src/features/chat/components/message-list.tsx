/** biome-ignore-all lint/a11y/noSvgWithoutTitle: no need check */
"use client";

import { Loader2 } from "lucide-react";
import { useUser } from "@/features/auth/api/get-me";
import type { Message } from "../types";
import { RealtimeChat } from "./ui/realtime-chat";

interface MessageListProps {
	messages: Message[];
	isLoading?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
}

/**
 * MessageList component - Wrapper around RealtimeChat for backwards compatibility
 * Now uses Supabase UI component pattern with auto-scroll and realtime updates
 */
export function MessageList({
	messages,
	isLoading = false,
	hasMore = false,
	onLoadMore,
}: MessageListProps) {
	const user = useUser();

	if (!user?.id) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	return (
		<RealtimeChat
			messages={messages}
			currentUserId={user.id}
			isLoading={isLoading}
			autoScroll
			hasMore={hasMore}
			onLoadMore={onLoadMore}
		/>
	);
}
