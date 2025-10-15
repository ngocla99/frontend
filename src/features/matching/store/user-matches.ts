import { create } from "zustand";

type UserMatchType = {
	name: string;
	photo: string;
};

export type UserMatchesType = {
	user1: UserMatchType;
	user2: UserMatchType;
};
type UserMatchesStore = {
	open: boolean;
	userMatches: UserMatchesType | null;
	matchId: string | null;
	actions: {
		onOpen: (userMatches: UserMatchesType, matchId: string) => void;
		onClose: () => void;
		onOpenChange: (open: boolean) => void;
	};
};

const useUserMatchesStore = create<UserMatchesStore>()((set) => ({
	open: false,
	userMatches: null,
	matchId: null,
	actions: {
		onOpen: (userMatches: UserMatchesType, matchId: string) => {
			set({ open: true, userMatches, matchId });
		},
		onClose: () => {
			set({ open: false, userMatches: null, matchId: null });
		},
		onOpenChange: (open: boolean) => {
			set({ open });
		},
	},
}));

export const useUserMatchesOpen = () =>
	useUserMatchesStore((state) => state.open);
export const useUserMatches = () =>
	useUserMatchesStore((state) => state.userMatches);
export const useMatchId = () => useUserMatchesStore((state) => state.matchId);
export const useUserMatchesActions = () =>
	useUserMatchesStore((state) => state.actions);
