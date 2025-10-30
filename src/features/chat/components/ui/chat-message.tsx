"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MessageType } from "../../types";

export interface ChatMessageProps {
	/**
	 * Message content to display
	 */
	content: string;
	/**
	 * Timestamp when message was created
	 */
	createdAt: Date | string;
	/**
	 * Whether this message is from the current user
	 */
	isOwn: boolean;
	/**
	 * Optional message type for special rendering
	 */
	messageType?: MessageType;
	/**
	 * Optional custom class name
	 */
	className?: string;
	/**
	 * Whether to show header (timestamp) for this message
	 */
	showHeader?: boolean;
	/**
	 * Whether this message is pending (not yet sent to server)
	 * Used for optimistic UI updates - shows reduced opacity
	 */
	pending?: boolean;
}

/**
 * ChatMessage component for displaying individual messages
 * Follows Supabase UI component pattern with composition and flexibility
 */
export function ChatMessage({
	content,
	createdAt,
	isOwn,
	messageType = "text",
	className,
	showHeader = true,
	pending = false,
}: ChatMessageProps) {
	// Special rendering for icebreaker messages
	if (messageType === "icebreaker") {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className={cn("flex justify-center my-6", className)}
			>
				<div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl px-6 py-3 max-w-md text-center">
					<p className="text-sm text-purple-900 dark:text-purple-100">
						🤖 {content}
					</p>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			className={cn(
				"flex mb-2",
				isOwn ? "justify-end" : "justify-start",
				className,
				pending && "opacity-30", // Reduced opacity for pending messages
			)}
		>
			<div
				className={cn("flex flex-col max-w-[70%] gap-1", isOwn && "items-end")}
			>
				{showHeader && (
					<div
						className={cn("flex items-center gap-2 text-xs px-3", {
							"justify-end flex-row-reverse": isOwn,
						})}
					>
						{" "}
						{/* <span className={"font-medium"}>{sender_name}</span> */}
						<span className="text-foreground/50 text-xs">
							{" "}
							{new Date(createdAt).toLocaleTimeString("en-US", {
								hour: "2-digit",
								minute: "2-digit",
								hour12: true,
							})}
						</span>
					</div>
				)}
				<div
					className={cn(
						"rounded-2xl px-4 py-2.5 break-words transition-opacity duration-200",
						isOwn
							? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
							: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
					)}
				>
					<p className="text-sm whitespace-pre-wrap">{content}</p>
				</div>
			</div>
		</motion.div>
	);
}
