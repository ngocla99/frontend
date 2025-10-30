import { format, isToday, isYesterday, isThisYear } from "date-fns";
import type { Message } from "../types";

export interface GroupedMessages {
	dateLabel: string;
	messages: Message[];
}

/**
 * Groups messages by date and returns them in display order
 * @param messages - Array of messages to group
 * @returns Array of grouped messages with date labels
 */
export function groupMessagesByDate(messages: Message[]): GroupedMessages[] {
	// Create a map to group messages by date
	const grouped = messages.reduce(
		(acc: Record<string, Message[]>, message) => {
			const date = new Date(message.created_at);
			const key = format(date, "yyyy-MM-dd");

			if (!acc[key]) {
				acc[key] = [];
			}

			acc[key].push(message);

			return acc;
		},
		{},
	);

	// Convert to array and add formatted date labels
	return Object.entries(grouped).map(([dateKey, msgs]) => {
		const date = new Date(dateKey);
		const dateLabel = formatDateLabel(date);

		return {
			dateLabel,
			messages: msgs,
		};
	});
}

/**
 * Formats a date into a human-readable label
 * - "Today" for today's messages
 * - "Yesterday" for yesterday's messages
 * - "Aug 23" for this year
 * - "Aug 23, 2023" for previous years
 */
function formatDateLabel(date: Date): string {
	if (isToday(date)) {
		return "Today";
	}

	if (isYesterday(date)) {
		return "Yesterday";
	}

	if (isThisYear(date)) {
		return format(date, "MMM d");
	}

	return format(date, "MMM d, yyyy");
}
