import { create } from "zustand";
import type { PresenceState } from "../types";

/**
 * Presence store - tracks online/offline status for all users
 * Updated by usePresenceTracker hook in root layout
 */
interface PresenceStoreState {
	// Raw presence state from Supabase
	presenceState: PresenceState;
	// Derived map: user_id -> isOnline
	onlineUsers: Set<string>;
	// Actions
	actions: {
		setPresenceState: (state: PresenceState) => void;
		userJoined: (userId: string) => void;
		userLeft: (userId: string) => void;
		isUserOnline: (userId: string) => boolean;
	};
}

export const usePresenceStore = create<PresenceStoreState>((set, get) => ({
	presenceState: {},
	onlineUsers: new Set(),

	actions: {
		setPresenceState: (presenceState: PresenceState) => {
			// Extract all online user IDs from presence state
			const onlineUsers = new Set<string>();
			for (const presenceKey of Object.keys(presenceState)) {
				const presences = presenceState[presenceKey];
				if (presences && presences.length > 0) {
					onlineUsers.add(presences[0].user_id);
				}
			}
			set({ presenceState, onlineUsers });
		},

		userJoined: (userId: string) => {
			set((state) => {
				const newOnlineUsers = new Set(state.onlineUsers);
				newOnlineUsers.add(userId);
				return { onlineUsers: newOnlineUsers };
			});
		},

		userLeft: (userId: string) => {
			set((state) => {
				const newOnlineUsers = new Set(state.onlineUsers);
				newOnlineUsers.delete(userId);
				return { onlineUsers: newOnlineUsers };
			});
		},

		isUserOnline: (userId: string) => {
			return get().onlineUsers.has(userId);
		},
	},
}));

// Atomic selectors for optimal performance
export const useIsUserOnline = (userId: string) =>
	usePresenceStore((state) => state.onlineUsers.has(userId));

export const usePresenceActions = () =>
	usePresenceStore((state) => state.actions);
