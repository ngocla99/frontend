// src/types/socket.ts
export interface SocketEvents {
	// Server to Client events
	joined: (data: { room: string }) => void;
	left: (data: { room: string }) => void;
	match_found: (data: MatchFoundEvent) => void;
	match_found_public: (data: MatchFoundEvent) => void;
	live_task_done: (data: LiveTaskDoneEvent) => void;
	error: (data: { message: string; code?: string }) => void;

	// Client to Server events
	join: (data: { room: string }) => void;
	leave: (data: { room: string }) => void;
	ping: () => void;
}

export interface MatchFoundEvent {
	task_id: string;
	source_user_id: string;
	source_face_id: string;
	target_user_id: string;
	target_face_id: string;
	similarity: number;
	target_image_url: string | null;
	timestamp: string;
}

export interface LiveTaskDoneEvent {
	task_id: string;
	count: number;
	timestamp: string;
}

export interface SocketState {
	isConnected: boolean;
	isConnecting: boolean;
	error: string | null;
	reconnectAttempts: number;
}

export interface RoomConfig {
	userId?: string;
	taskId?: string;
	customRooms?: string[];
}

export type SocketStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "reconnecting"
	| "error";
