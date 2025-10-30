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

	// Loading state component
	const loadingState = (
		<div className="flex items-center justify-center h-full">
			<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
		</div>
	);

	// Empty state component
	const emptyState = (
		<div className="flex flex-col items-center justify-center h-full text-center px-4">
			<div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-full p-6 mb-4">
				<svg
					className="w-12 h-12 text-blue-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			</div>
			<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
				Start the conversation
			</h3>
			<p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
				Send your first message to begin chatting
			</p>
		</div>
	);

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
			emptyState={emptyState}
			loadingState={loadingState}
			autoScroll
			hasMore={hasMore}
			onLoadMore={onLoadMore}
		/>
	);
}
