"use client";

import {
	MessageCircle,
	MessagesSquare,
	Search as SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlurImage } from "@/components/blur-image";
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
	onConnectionSelect,
	selectedConnectionId,
	className,
}: ChatListProps) {
	const router = useRouter();
	const { data } = useConnections();
	const [searchQuery, setSearchQuery] = useState("");

	const connections = data?.connections || [];

	// Filter connections by search query
	const filteredConnections = connections.filter((conn) =>
		conn.other_user.name
			.toLowerCase()
			.includes(searchQuery.trim().toLowerCase()),
	);

	const handleConnectionClick = (connection: MutualConnection) => {
		if (onConnectionSelect) {
			onConnectionSelect(connection);
		} else {
			router.push(`/chat/${connection.id}`);
		}
	};

	if (connections.length === 0) {
		return (
			<div
				className={cn(
					"grid place-content-center place-items-center w-full gap-2 sm:w-56 lg:w-72 2xl:w-80",
					className,
				)}
			>
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

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80",
				className,
			)}
		>
			{/* Sticky header with search */}
			<div className="sticky top-0 z-10 -mx-4 px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none">
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
								<BlurImage
									src={connection.other_user.profile_image || ""}
									alt={connection.other_user.name}
									width={32}
									height={32}
									className="rounded-full object-cover size-8"
								/>
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
