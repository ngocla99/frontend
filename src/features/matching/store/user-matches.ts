import { create } from "zustand";

type UserMatchType = {
	name: string;
	photo: string;
};

export type UserMatchesType = {
	user1: UserMatchType;
	user2: UserMatchType;
};

export type MatchMode = "own-match" | "live-match";

type UserMatchesStore = {
	open: boolean;
	userMatches: UserMatchesType | null;
	matchId: string | null;
	mode: MatchMode;
	actions: {
		onOpen: (
			userMatches: UserMatchesType,
			matchId?: string,
			mode?: MatchMode,
		) => void;
		onClose: () => void;
		onOpenChange: (open: boolean) => void;
	};
};

const useUserMatchesStore = create<UserMatchesStore>()((set) => ({
	open: false,
	userMatches: null,
	matchId: null,
	mode: "own-match",
	actions: {
		onOpen: (
			userMatches: UserMatchesType,
			matchId?: string,
			mode: MatchMode = "own-match",
		) => {
			set({ open: true, userMatches, matchId: matchId || null, mode });
		},
		onClose: () => {
			set({
				open: false,
				userMatches: null,
				matchId: null,
				mode: "own-match",
			});
		},
		onOpenChange: (open: boolean) => {
			set({ open });
			if (!open) {
				set({
					open: false,
					userMatches: null,
					matchId: null,
					mode: "own-match",
				});
			}
		},
	},
}));

export const useUserMatchesOpen = () =>
	useUserMatchesStore((state) => state.open);
export const useUserMatches = () =>
	useUserMatchesStore((state) => state.userMatches);
export const useMatchId = () => useUserMatchesStore((state) => state.matchId);
export const useMatchMode = () => useUserMatchesStore((state) => state.mode);
export const useUserMatchesActions = () =>
	useUserMatchesStore((state) => state.actions);
