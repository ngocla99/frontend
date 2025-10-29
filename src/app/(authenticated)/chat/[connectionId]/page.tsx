"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatRoom } from "@/features/chat/components";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutualConnection } from "@/features/chat/types";

interface ConnectionDetailResponse {
	id: string;
	profile_a: { id: string; name: string; profile_image: string | null };
	profile_b: { id: string; name: string; profile_image: string | null };
	match_id: string;
	baby_image: string | null;
	status: string;
	created_at: string;
}

async function getConnection(
	connectionId: string,
): Promise<ConnectionDetailResponse> {
	return api.get<ConnectionDetailResponse>(`/connections/${connectionId}`);
}

interface ChatRoomPageProps {
	params: Promise<{
		connectionId: string;
	}>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
	const { connectionId } = use(params);
	const router = useRouter();

	const { data: connection, isLoading } = useQuery({
		queryKey: ["connection", connectionId],
		queryFn: () => getConnection(connectionId),
		enabled: !!connectionId,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	if (!connection) {
		router.push("/chat");
		return null;
	}

	// Transform the connection data to match ChatRoom's expected format
	const transformedConnection = {
		id: connection.id,
		other_user: connection.profile_a, // or profile_b depending on current user
		baby_image: connection.baby_image,
	};

	return (
		<ChatRoom
			connectionId={connectionId}
			connection={transformedConnection}
		/>
	);
}
