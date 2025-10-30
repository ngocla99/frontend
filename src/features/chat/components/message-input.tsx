"use client";

import { Send } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
	/**
	 * Callback when user sends a message
	 */
	onSend: (content: string) => void;
	/**
	 * Whether the input is disabled (e.g., during message sending)
	 */
	disabled?: boolean;
	/**
	 * Placeholder text for the input
	 */
	placeholder?: string;
	/**
	 * Custom class name for the container
	 */
	className?: string;
}

/**
 * MessageInput component for sending messages
 * Follows Supabase UI pattern with clean composition
 * Features: auto-resize, keyboard shortcuts, disabled state
 */
export function MessageInput({
	onSend,
	disabled = false,
	placeholder = "Type a message...",
	className,
}: MessageInputProps) {
	const [message, setMessage] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = () => {
		const trimmed = message.trim();
		if (!trimmed || disabled) return;

		onSend(trimmed);
		setMessage("");

		// Reset textarea height after sending
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}

		// Focus back to textarea for better UX
		textareaRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		// Send on Enter, new line on Shift+Enter
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleChange = (value: string) => {
		setMessage(value);

		// Auto-resize textarea based on content
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	return (
		<div
			className={cn(
				"border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4",
				className,
			)}
		>
			<div className="flex items-end gap-2">
				<Textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => handleChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled}
					rows={1}
					className={cn(
						"resize-none min-h-[44px] max-h-[120px]",
						"focus-visible:ring-blue-500 transition-all",
					)}
					aria-label="Message input"
				/>
				<Button
					onClick={handleSend}
					disabled={disabled || !message.trim()}
					size="icon"
					className="shrink-0 h-[44px] w-[44px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all"
					aria-label="Send message"
				>
					<Send className="h-5 w-5" />
				</Button>
			</div>
			<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
				Press Enter to send, Shift+Enter for new line
			</p>
		</div>
	);
}
