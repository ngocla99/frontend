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
	 * Sender's avatar URL (only shown for non-own messages)
	 */
	senderAvatar?: string | null;
	/**
	 * Sender's name (for avatar fallback)
	 */
	senderName?: string;
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
	/**
	 * When the message was read by the recipient (if applicable)
	 * Only shown for own messages
	 */
	readAt?: string | null;
}

/**
 * ChatMessage component for displaying individual messages
 * Follows Supabase UI component pattern with composition and flexibility
 */
export function ChatMessage({
	content,
	createdAt,
	isOwn,
	senderAvatar,
	senderName,
	messageType = "text",
	className,
	showHeader = true,
	pending = false,
	readAt,
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
				<div className="bg-gradient-to-r from-pink-400 to-red-400 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl px-6 py-3 max-w-md text-center">
					<p className="text-sm text-white dark:text-purple-100">{content}</p>
				</div>
			</motion.div>
		);
	}

	const _formattedTime = new Date(createdAt).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

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
			<div>
				{showHeader && (
					<div
						className={cn("flex gap-2 text-xs px-3 mb-1", {
							"justify-end": isOwn,
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
						"chat-box max-w-72 px-3 py-2 break-words shadow-lg",
						isOwn
							? "bg-foreground text-background self-end rounded-[16px_16px_0_16px]"
							: "bg-muted self-start rounded-[16px_16px_16px_0]",
					)}
				>
					<p className="text-sm whitespace-pre-wrap">{content}</p>
					{/* <span
					className={cn(
						"text-foreground/75 mt-1 block text-xs font-light italic",
						isOwn && "text-primary-foreground/85 text-end",
						)}
						>
						{formattedTime}
						{isOwn && readAt && <span className="ml-1 text-[10px]">· Read</span>}
						</span> */}
				</div>
			</div>
		</motion.div>
	);
}
