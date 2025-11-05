/** biome-ignore-all lint/a11y/noSvgWithoutTitle: no need check */
"use client";

import { Fragment, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChatScroll } from "../../hooks/use-chat-scroll";
import type { Message } from "../../types";
import { groupMessagesByDate } from "../../utils/date-grouping";
import { ChatMessage } from "./chat-message";

/**
 * ChatSkeleton component - Loading skeleton for chat messages
 * Matches the compact message bubble design with timestamps
 */
function ChatSkeleton() {
	return (
		<div className="flex-1 overflow-y-auto p-4 space-y-2">
			{/* Date divider skeleton */}
			<div className="text-center my-4">
				<Skeleton className="h-6 w-20 rounded-full mx-auto" />
			</div>

			{/* Left message group (other user) */}
			<div className="flex justify-start mb-2">
				<div>
					{/* Timestamp */}
					<div className="flex gap-2 px-3 mb-1">
						<Skeleton className="h-3 w-16" />
					</div>
					{/* Message bubble */}
					<Skeleton className="h-9 w-32 rounded-[16px_16px_16px_0]" />
				</div>
			</div>

			{/* Left message without timestamp (grouped) */}
			<div className="flex justify-start mb-2">
				<Skeleton className="h-9 w-24 rounded-[16px_16px_16px_0]" />
			</div>

			{/* Left message without timestamp (grouped) */}
			<div className="flex justify-start mb-2">
				<Skeleton className="h-9 w-40 rounded-[16px_16px_16px_0]" />
			</div>

			{/* Right message group (current user) */}
			<div className="flex justify-end mb-2">
				<div>
					{/* Timestamp */}
					<div className="flex gap-2 px-3 mb-1 justify-end">
						<Skeleton className="h-3 w-16" />
					</div>
					{/* Message bubble */}
					<Skeleton className="h-9 w-36 rounded-[16px_16px_0_16px]" />
				</div>
			</div>

			{/* Right message without timestamp (grouped) */}
			<div className="flex justify-end mb-2">
				<Skeleton className="h-9 w-44 rounded-[16px_16px_0_16px]" />
			</div>

			{/* Right message without timestamp (grouped) */}
			<div className="flex justify-end mb-2">
				<Skeleton className="h-9 w-28 rounded-[16px_16px_0_16px]" />
			</div>

			{/* Right message without timestamp (grouped) */}
			<div className="flex justify-end mb-2">
				<Skeleton className="h-9 w-52 rounded-[16px_16px_0_16px]" />
			</div>

			{/* Left message group (other user) */}
			<div className="flex justify-start mb-2">
				<div>
					{/* Timestamp */}
					<div className="flex gap-2 px-3 mb-1">
						<Skeleton className="h-3 w-16" />
					</div>
					{/* Message bubble */}
					<Skeleton className="h-9 w-48 rounded-[16px_16px_16px_0]" />
				</div>
			</div>
		</div>
	);
}

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

	// Sort messages by creation time (oldest first)
	const sortedMessages = useMemo(() => {
		return [...messages].sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);
	}, [messages]);

	// Group messages by date
	const groupedMessages = useMemo(() => {
		return groupMessagesByDate(sortedMessages);
	}, [sortedMessages]);

	if (isLoading) {
		return <ChatSkeleton />;
	}

	if (!isLoading && messages.length === 0) {
		return (
			<div className={cn("flex-1 overflow-y-auto p-4", className)}>
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

			{/* Messages grouped by date */}
			{groupedMessages.map((group) => (
				<Fragment key={group.dateLabel}>
					{/* Date divider */}
					<div className="text-center text-xs my-4">
						<span className="bg-background px-3 py-1 rounded-full text-muted-foreground border">
							{group.dateLabel}
						</span>
					</div>

					{/* Messages for this date */}
					{group.messages.map((message, index) => {
						const prevMessage = index > 0 ? group.messages[index - 1] : null;
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
								readAt={message.read_at}
							/>
						);
					})}
				</Fragment>
			))}
		</div>
	);
}
