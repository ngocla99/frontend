"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "../types";
import { cn } from "@/lib/utils";

interface MessageItemProps {
	message: Message;
	isOwn: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
	const isIcebreaker = message.message_type === "icebreaker";

	// Icebreaker messages are centered
	if (isIcebreaker) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className="flex justify-center my-6"
			>
				<div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl px-6 py-3 max-w-md text-center">
					<p className="text-sm text-purple-900 dark:text-purple-100">
						🤖 {message.content}
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
			className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}
		>
			<div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
				<div
					className={cn(
						"rounded-2xl px-4 py-2.5 break-words",
						isOwn
							? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
							: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
					)}
				>
					<p className="text-sm whitespace-pre-wrap">{message.content}</p>
				</div>
				<span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
					{formatDistanceToNow(new Date(message.created_at), {
						addSuffix: true,
					})}
				</span>
			</div>
		</motion.div>
	);
}
