"use client";

import { Check, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import confirm from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClearAllNotifications } from "../api/clear-all-notifications";
import { useNotifications } from "../api/get-notifications";
import { useMarkAllNotificationsRead } from "../api/mark-all-read";
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
	const [filter, setFilter] = useState<"all" | "unread">("all");

	const { data, isLoading } = useNotifications({
		input: {
			limit: 20,
			unread_only: filter === "unread",
		},
	});

	// Subscribe to real-time notifications
	useNotificationsRealtime({
		userId,
		enabled: true,
	});

	const markAllAsReadMutation = useMarkAllNotificationsRead();
	const clearAllMutation = useClearAllNotifications();

	const unreadCount = data?.unread_count || 0;
	const hasUnread = unreadCount > 0;
	const hasNotifications = (data?.notifications?.length || 0) > 0;

	const handleMarkAllAsRead = () => {
		if (markAllAsReadMutation.isPending) return;
		markAllAsReadMutation.mutate();
	};

	const handleClearAll = () => {
		if (clearAllMutation.isPending) return;
		confirm({
			type: "warning",
			title: "Clear all notifications",
			description:
				"Are you sure you want to clear all notifications? This action cannot be undone.",
			onConfirm: clearAllMutation.mutate,
		});
	};

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
				<div className="border-b px-4 py-3">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold">Notifications</h3>
						<div className="flex items-center gap-2">
							{hasNotifications && (
								<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreVertical className="h-4 w-4" />
											<span className="sr-only">More actions</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{hasUnread && (
											<DropdownMenuItem
												onClick={handleMarkAllAsRead}
												disabled={markAllAsReadMutation.isPending}
											>
												<Check className="h-4 w-4 mr-2" />
												Mark all as read
											</DropdownMenuItem>
										)}
										<DropdownMenuItem
											onClick={handleClearAll}
											disabled={clearAllMutation.isPending}
											className="text-destructive focus:text-destructive"
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Clear all
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					</div>
					<Tabs
						value={filter}
						onValueChange={(v) => setFilter(v as "all" | "unread")}
					>
						<TabsList className="w-full grid grid-cols-2">
							<TabsTrigger value="all" className="text-xs">
								All
							</TabsTrigger>
							<TabsTrigger value="unread" className="text-xs">
								Unread
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
				<NotificationList
					notifications={data?.notifications || []}
					isLoading={isLoading}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
