"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification } from "../types";
import { NotificationItem } from "./notification-item";

interface NotificationListProps {
	notifications: Notification[];
	isLoading: boolean;
}

/**
 * Scrollable list of notifications
 */
export function NotificationList({
	notifications,
	isLoading,
}: NotificationListProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (notifications.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<p className="text-muted-foreground text-sm">No notifications yet</p>
				<p className="text-muted-foreground text-xs mt-1">
					We'll notify you when something happens!
				</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-[400px]">
			<div className="divide-y">
				{notifications.map((notification) => (
					<NotificationItem key={notification.id} notification={notification} />
				))}
			</div>
		</ScrollArea>
	);
}
