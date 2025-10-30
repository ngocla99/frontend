"use client";

import { formatDistanceToNow } from "date-fns";
import { Baby, Heart, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMarkNotificationRead } from "../api/mark-notification-read";
import type { Notification } from "../types";

interface NotificationItemProps {
	notification: Notification;
}

/**
 * Individual notification item
 *
 * Handles click to navigate to related content and mark as read
 */
export function NotificationItem({ notification }: NotificationItemProps) {
	const router = useRouter();
	const markAsRead = useMarkNotificationRead();

	const handleClick = () => {
		// Mark as read if unread
		if (!notification.read_at) {
			markAsRead.mutate(notification.id);
		}

		// Navigate based on notification type and related entity
		if (notification.type === "mutual_match" && notification.related_id) {
			// Navigate to chat with this connection
			router.push(`/chat/${notification.related_id}`);
		} else if (notification.type === "baby_generated") {
			// Navigate to your matches page
			router.push("/your-matches");
		} else if (notification.type === "new_message" && notification.related_id) {
			// Navigate to chat (need to get connection_id from message)
			// For now, just go to chat list
			router.push("/chat");
		}
	};

	const getIcon = () => {
		switch (notification.type) {
			case "baby_generated":
				return <Baby className="h-5 w-5 text-pink-500" />;
			case "mutual_match":
				return <Heart className="h-5 w-5 text-red-500" />;
			case "new_message":
				return <MessageCircle className="h-5 w-5 text-blue-500" />;
			default:
				return null;
		}
	};

	const isUnread = !notification.read_at;

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"w-full px-4 py-3 text-left hover:bg-accent transition-colors",
				isUnread && "bg-accent/50",
			)}
		>
			<div className="flex gap-3">
				<div className="flex-shrink-0 mt-1">{getIcon()}</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<p
							className={cn("text-sm font-medium", isUnread && "font-semibold")}
						>
							{notification.title}
						</p>
						{isUnread && (
							<div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
						)}
					</div>
					{notification.message && (
						<p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
							{notification.message}
						</p>
					)}
					<p className="text-xs text-muted-foreground mt-1">
						{formatDistanceToNow(new Date(notification.created_at), {
							addSuffix: true,
						})}
					</p>
				</div>
			</div>
		</button>
	);
}
