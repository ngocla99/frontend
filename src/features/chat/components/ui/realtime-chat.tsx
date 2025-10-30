/** biome-ignore-all lint/a11y/noSvgWithoutTitle: no need check */
"use client";

import { type ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useChatScroll } from "../../hooks/use-chat-scroll";
import type { Message } from "../../types";
import { ChatMessage } from "./chat-message";

export interface RealtimeChatProps {
	/**
	 * Array of messages to display
	 */
	messages: Message[];
	/**
	 * Current user ID to determine message ownership
	 */
	currentUserId: string;
	/**
	 * Loading state indicator
	 */
	isLoading?: boolean;
	/**
	 * Custom empty state component
	 */
	emptyState?: ReactNode;
	/**
	 * Custom loading component
	 */
	loadingState?: ReactNode;
	/**
	 * Whether to enable auto-scroll to bottom
	 */
	autoScroll?: boolean;
	/**
	 * Custom class name for the container
	 */
	className?: string;
	/**
	 * Whether there are more messages to load
	 */
	hasMore?: boolean;
	/**
	 * Callback when user scrolls to top (for pagination)
	 */
	onLoadMore?: () => void;
}

/**
 * RealtimeChat component - Main chat interface wrapper
 * Follows Supabase UI component pattern with composition
 * Handles message display, auto-scroll, and real-time updates
 */
export function RealtimeChat({
	messages,
	currentUserId,
	isLoading = false,
	emptyState,
	loadingState,
	autoScroll = true,
	className,
	hasMore = false,
	onLoadMore,
}: RealtimeChatProps) {
	// Auto-scroll to bottom when new messages arrive
	const scrollRef = useChatScroll<HTMLDivElement>({
		dependencies: [messages.length],
		enabled: autoScroll,
		smooth: true,
	});

	// Sort messages by creation time (newest first for display purposes)
	const sortedMessages = useMemo(() => {
		return [...messages].sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);
	}, [messages]);

	// Loading state
	if (isLoading && messages.length === 0) {
		return (
			<div className={cn("flex-1 overflow-y-auto p-4", className)}>
				{loadingState || (
					<div className="flex items-center justify-center h-full">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
					</div>
				)}
			</div>
		);
	}

	// Empty state
	if (!isLoading && messages.length === 0) {
		return (
			<div className={cn("flex-1 overflow-y-auto p-4", className)}>
				{emptyState || (
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
				)}
			</div>
		);
	}

	// Messages list
	return (
		<div
			ref={scrollRef}
			className={cn("flex-1 overflow-y-auto p-4 space-y-2", className)}
		>
			{/* Load more button */}
			{hasMore && onLoadMore && (
				<div className="flex justify-center mb-4">
					<button
						type="button"
						onClick={onLoadMore}
						className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						Load earlier messages
					</button>
				</div>
			)}

			{/* Messages */}
			{sortedMessages.map((message, index) => {
				const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
				const showHeader =
					!prevMessage || prevMessage.sender_id !== message.sender_id;

				return (
					<ChatMessage
						key={message.local_id || message.id}
						content={message.content}
						createdAt={message.created_at}
						isOwn={message.sender_id === currentUserId}
						messageType={message.message_type}
						showHeader={showHeader}
						pending={message.pending}
					/>
				);
			})}
		</div>
	);
}
