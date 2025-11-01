"use client";

import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useConnections } from "../api/get-connections";
import type { MutualConnection } from "../types";
import { ChatList } from "./chat-list";
import { ChatRoom } from "./chat-room";

interface ChatContainerProps {
	/**
	 * Optional default connection ID to select (e.g., from URL)
	 */
	defaultConnectionId?: string;
}

export function ChatContainer({ defaultConnectionId }: ChatContainerProps) {
	const [selectedConnection, setSelectedConnection] =
		useState<MutualConnection | null>(null);
	const [mobileSelectedConnection, setMobileSelectedConnection] =
		useState<MutualConnection | null>(null);

	const { data } = useConnections();
	const connections = data?.connections || [];

	// Set the default connection when data is loaded
	useEffect(() => {
		if (defaultConnectionId && !selectedConnection && connections.length > 0) {
			const defaultConnection = connections.find(
				(conn) => conn.id === defaultConnectionId,
			);
			if (defaultConnection) {
				setSelectedConnection(defaultConnection);
				setMobileSelectedConnection(defaultConnection);
			}
		}
	}, [connections, defaultConnectionId, selectedConnection]);

	const handleConnectionSelect = (connection: MutualConnection) => {
		setSelectedConnection(connection);
		setMobileSelectedConnection(connection);
	};

	return (
		<section className="flex h-screen gap-6 pt-24 max-w-6xl mx-auto px-4 lg:px-8 py-6">
			{/* Left Side - Conversation List */}
			<ChatList
				connections={connections}
				selectedConnectionId={selectedConnection?.id}
				onConnectionSelect={handleConnectionSelect}
			/>

			{/* Right Side - Chat Room or Empty State */}
			{selectedConnection ? (
				<div
					className={cn(
						"bg-white absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border shadow-xs overflow-hidden sm:static sm:z-auto sm:flex sm:rounded-md",
						mobileSelectedConnection && "start-0 flex",
					)}
				>
					<ChatRoom
						connectionId={selectedConnection.id}
						connection={{
							id: selectedConnection.id,
							other_user: selectedConnection.other_user,
							baby_image: selectedConnection.baby_image,
						}}
						onBack={() => setMobileSelectedConnection(null)}
						className="h-full"
					/>
				</div>
			) : (
				<div
					className={cn(
						"bg-card absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border shadow-xs sm:static sm:z-auto sm:flex",
					)}
				>
					<div className="flex flex-col items-center space-y-6">
						<div className="border-border flex size-16 items-center justify-center rounded-full border-2">
							<MessagesSquare className="size-8" />
						</div>
						<div className="space-y-2 text-center">
							<h1 className="text-xl font-semibold">Your messages</h1>
							<p className="text-muted-foreground text-sm">
								Select a conversation to start a chat.
							</p>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
