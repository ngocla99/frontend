"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { MessageItem } from "./message-item";
import type { Message } from "../types";
import { useUser } from "@/features/auth/api/get-me";

interface MessageListProps {
	messages: Message[];
	isLoading?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
}

export function MessageList({
	messages,
	isLoading = false,
	hasMore = false,
	onLoadMore,
}: MessageListProps) {
	const user = useUser();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const prevMessagesLengthRef = useRef(messages.length);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (messages.length > prevMessagesLengthRef.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
		prevMessagesLengthRef.current = messages.length;
	}, [messages.length]);

	// Initial scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
	}, []);

	// Handle scroll for pagination
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !hasMore || !onLoadMore) return;

		const handleScroll = () => {
			if (container.scrollTop === 0) {
				onLoadMore();
			}
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [hasMore, onLoadMore]);

	if (isLoading && messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center space-y-2">
					<p className="text-gray-500 dark:text-gray-400">
						No messages yet
					</p>
					<p className="text-sm text-gray-400 dark:text-gray-500">
						Start the conversation!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="flex-1 overflow-y-auto px-4 py-6 space-y-1"
		>
			{hasMore && (
				<div className="flex justify-center py-2">
					<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
				</div>
			)}

			{/* Messages in reverse chronological order (newest at bottom) */}
			{[...messages].reverse().map((message) => (
				<MessageItem
					key={message.id}
					message={message}
					isOwn={message.sender_id === user?.id}
				/>
			))}

			{/* Invisible element for auto-scroll */}
			<div ref={messagesEndRef} />
		</div>
	);
}
