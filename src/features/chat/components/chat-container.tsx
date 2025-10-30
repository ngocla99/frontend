"use client";

import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetConnection } from "../api/get-connection";
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

	// Fetch the default connection if provided
	const { data: defaultConnectionData } = useGetConnection({
		input: defaultConnectionId ? { id: defaultConnectionId } : undefined,
	});

	// Set the default connection when data is loaded
	useEffect(() => {
		if (defaultConnectionData?.connection && !selectedConnection) {
			const transformedConnection: MutualConnection = {
				id: defaultConnectionData.connection.id,
				other_user: defaultConnectionData.connection.other_user,
				baby_image: defaultConnectionData.connection.baby_image,
				last_message: null, // Not available from single connection endpoint
				unread_count: 0, // Not available from single connection endpoint
				created_at: defaultConnectionData.connection.created_at,
			};
			setSelectedConnection(transformedConnection);
			setMobileSelectedConnection(transformedConnection);
		}
	}, [defaultConnectionData, selectedConnection]);

	const handleConnectionSelect = (connection: MutualConnection) => {
		setSelectedConnection(connection);
		setMobileSelectedConnection(connection);
	};

	return (
		<section className="flex h-screen gap-6 pt-24 max-w-6xl mx-auto px-4 lg:px-8 py-6">
			{/* Left Side - Conversation List */}
			<ChatList
				onConnectionSelect={handleConnectionSelect}
				selectedConnectionId={selectedConnection?.id}
			/>

			{/* Right Side - Chat Room or Empty State */}
			{selectedConnection ? (
				<div
					className={cn(
						"bg-background absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border shadow-xs overflow-hidden sm:static sm:z-auto sm:flex sm:rounded-md",
						mobileSelectedConnection && "start-0 flex",
					)}
				>
					<ChatRoom
						embedded
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
								Send a message to start a chat.
							</p>
						</div>
						<Button disabled>Send message</Button>
					</div>
				</div>
			)}
		</section>
	);
}
