/**
 * Connection status
 */
export type ConnectionStatus = "active" | "blocked" | "archived";

/**
 * Mutual connection between two users
 */
export interface MutualConnection {
	id: string;
	other_user: {
		id: string;
		name: string;
		profile_image: string | null;
	};
	baby_image: string | null;
	last_message: {
		content: string;
		created_at: string;
		is_mine: boolean;
	} | null;
	unread_count: number;
	created_at: string;
}

/**
 * API response for connections list
 */
export interface ConnectionsResponse {
	connections: MutualConnection[];
	total: number;
}

/**
 * Parameters for fetching connections
 */
export interface GetConnectionsParams {
	status?: ConnectionStatus;
	limit?: number;
	offset?: number;
}

/**
 * Message types
 */
export type MessageType = "text" | "image" | "icebreaker";

/**
 * Chat message
 */
export interface Message {
	id: string;
	sender_id: string;
	sender_name: string;
	content: string;
	message_type: MessageType;
	read_at: string | null;
	created_at: string;
}

/**
 * API response for messages list
 */
export interface MessagesResponse {
	messages: Message[];
	has_more: boolean;
	next_cursor: string | null;
}

/**
 * Parameters for fetching messages
 */
export interface GetMessagesParams {
	connectionId: string;
	limit?: number;
	before?: string;
}

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
	connection_id: string;
	content: string;
	message_type?: MessageType;
}
