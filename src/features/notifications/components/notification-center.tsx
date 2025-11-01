"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "../api/get-notifications";
import { useNotificationsRealtime } from "../hooks/use-notifications-realtime";
import { BellIcon } from "../icons/bell-icon";
import { NotificationList } from "./notification-list";

interface NotificationCenterProps {
	userId: string;
}

/**
 * Notification center with bell icon and dropdown
 *
 * Shows unread notification count and displays notification list on click
 */
export function NotificationCenter({ userId }: NotificationCenterProps) {
	const { data, isLoading } = useNotifications({
		input: {
			limit: 20,
		},
	});

	// Subscribe to real-time notifications
	useNotificationsRealtime({
		userId,
		enabled: true,
	});

	const unreadCount = data?.unread_count || 0;
	const hasUnread = unreadCount > 0;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative [&_svg:not([class*='size-'])]:size-5"
				>
					<BellIcon />
					{hasUnread && (
						<Badge
							variant="destructive"
							className="absolute top-[1px] right-[1px] size-4 rounded-full p-0 text-xs flex items-center justify-center"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
					<span className="sr-only">Notifications</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[380px] p-0">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h3 className="font-semibold">Notifications</h3>
					{hasUnread && (
						<Badge variant="secondary" className="ml-auto">
							{unreadCount} new
						</Badge>
					)}
				</div>
				<NotificationList
					notifications={data?.notifications || []}
					isLoading={isLoading}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
