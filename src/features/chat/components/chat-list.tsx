"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, MessagesSquare, Search as SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useConnections } from "../hooks";
import type { MutualConnection } from "../types";

export interface ChatListProps {
	/**
	 * Whether the component is embedded in a two-column layout
	 */
	embedded?: boolean;
	/**
	 * Callback when a connection is selected (for embedded mode)
	 */
	onConnectionSelect?: (connection: MutualConnection) => void;
	/**
	 * Currently selected connection ID (for highlighting in embedded mode)
	 */
	selectedConnectionId?: string;
	/**
	 * Custom class name for the container
	 */
	className?: string;
}

export function ChatList({
	embedded = false,
	onConnectionSelect,
	selectedConnectionId,
	className,
}: ChatListProps) {
	const router = useRouter();
	const { data, isLoading } = useConnections({});
	const [searchQuery, setSearchQuery] = useState("");

	const connections = data?.connections || [];

	// Filter connections by search query
	const filteredConnections = connections.filter((conn) =>
		conn.other_user.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
	);

	const handleConnectionClick = (connection: MutualConnection) => {
		if (embedded && onConnectionSelect) {
			onConnectionSelect(connection);
		} else {
			router.push(`/chat/${connection.id}`);
		}
	};

	if (isLoading) {
		return (
			<div className={cn("flex items-center justify-center h-screen", className)}>
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	if (connections.length === 0) {
		return (
			<div className={cn("flex flex-col items-center justify-center h-screen px-4", className)}>
				<MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
					No conversations yet
				</h2>
				<p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
					Generate babies with your matches to unlock chat!
				</p>
			</div>
		);
	}

	// Embedded mode (sidebar in two-column layout)
	if (embedded) {
		return (
			<div className={cn("flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80", className)}>
				{/* Sticky header with search */}
				<div className="bg-background sticky top-0 z-10 -mx-4 px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
					<div className="flex items-center justify-between py-2">
						<div className="flex gap-2">
							<h1 className="text-2xl font-bold">Inbox</h1>
							<MessagesSquare size={20} />
						</div>
					</div>

					{/* Search input */}
					<label
						className={cn(
							"focus-within:ring-ring focus-within:ring-1 focus-within:outline-hidden",
							"border-border flex h-10 w-full items-center space-x-0 rounded-md border ps-2",
						)}
					>
						<SearchIcon size={15} className="me-2 stroke-slate-500" />
						<span className="sr-only">Search</span>
						<input
							type="text"
							className="w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden"
							placeholder="Search chat..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</label>
				</div>

				{/* Connections list */}
				<ScrollArea className="-mx-3 h-full p-3">
					{filteredConnections.map((connection) => (
						<div key={connection.id}>
							<button
								type="button"
								className={cn(
									"group hover:bg-accent hover:text-accent-foreground",
									"flex w-full rounded-md px-2 py-2 text-start text-sm",
									selectedConnectionId === connection.id && "sm:bg-muted",
								)}
								onClick={() => handleConnectionClick(connection)}
							>
								<div className="flex gap-2">
									<Avatar>
										<AvatarImage
											src={connection.other_user.profile_image || undefined}
											alt={connection.other_user.name}
										/>
										<AvatarFallback>{connection.other_user.name}</AvatarFallback>
									</Avatar>
									<div>
										<span className="col-start-2 row-span-2 font-medium">
											{connection.other_user.name}
										</span>
										{connection.last_message && (
											<span className="text-muted-foreground group-hover:text-accent-foreground/90 col-start-2 row-span-2 row-start-2 line-clamp-2 text-ellipsis">
												{connection.last_message.is_mine && "You: "}
												{connection.last_message.content}
											</span>
										)}
									</div>
								</div>
							</button>
							<Separator className="my-1" />
						</div>
					))}
				</ScrollArea>
			</div>
		);
	}

	// Standalone mode (full page)
	return (
		<div className={cn("h-screen bg-gray-50 dark:bg-gray-900", className)}>
			<div className="max-w-2xl mx-auto h-full flex flex-col">
				{/* Header */}
				<div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Messages
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
						{connections.length} conversation
						{connections.length !== 1 ? "s" : ""}
					</p>
				</div>

				{/* Connections List */}
				<div className="flex-1 overflow-y-auto">
					<div className="divide-y divide-gray-200 dark:divide-gray-800">
						{connections.map((connection, index) => (
							<ConnectionItem
								key={connection.id}
								connection={connection}
								onClick={() => handleConnectionClick(connection)}
								index={index}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

interface ConnectionItemProps {
	connection: MutualConnection;
	onClick: () => void;
	index: number;
}

function ConnectionItem({ connection, onClick, index }: ConnectionItemProps) {
	const { other_user, baby_image, last_message, unread_count } = connection;

	const initials = other_user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<motion.button
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
			onClick={onClick}
			className={cn(
				"w-full flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-950",
				"hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
				"focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800",
			)}
		>
			{/* Avatar with Baby Image */}
			<div className="relative shrink-0">
				<Avatar className="h-14 w-14">
					<AvatarImage src={other_user.profile_image || undefined} />
					<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
						{initials}
					</AvatarFallback>
				</Avatar>
				{baby_image && (
					<div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white dark:border-gray-950 overflow-hidden">
						<Image
							width={24}
							height={24}
							src={baby_image}
							alt="Baby"
							className="w-full h-full object-cover"
						/>
					</div>
				)}
			</div>

			{/* Message Info */}
			<div className="flex-1 min-w-0 text-left">
				<div className="flex items-center justify-between mb-1">
					<h3 className="font-semibold text-gray-900 dark:text-white truncate">
						{other_user.name}
					</h3>
					{last_message && (
						<span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
							{formatDistanceToNow(new Date(last_message.created_at), {
								addSuffix: true,
							})}
						</span>
					)}
				</div>

				{last_message ? (
					<div className="flex items-center justify-between gap-2">
						<p
							className={cn(
								"text-sm truncate",
								unread_count > 0
									? "font-medium text-gray-900 dark:text-white"
									: "text-gray-500 dark:text-gray-400",
							)}
						>
							{last_message.is_mine && "You: "}
							{last_message.content}
						</p>
						{unread_count > 0 && (
							<Badge
								variant="default"
								className="shrink-0 bg-blue-500 hover:bg-blue-600"
							>
								{unread_count}
							</Badge>
						)}
					</div>
				) : (
					<p className="text-sm text-gray-400 dark:text-gray-500">
						No messages yet
					</p>
				)}
			</div>
		</motion.button>
	);
}
