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
	actions: {
		onOpen: (userMatches: UserMatchesType) => void;
		onClose: () => void;
		onOpenChange: (open: boolean) => void;
	};
};

const useUserMatchesStore = create<UserMatchesStore>()((set) => ({
	open: false,
	userMatches: null,
	actions: {
		onOpen: (userMatches: UserMatchesType) => {
			set({ open: true, userMatches });
		},
		onClose: () => {
			set({ open: false, userMatches: null });
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
export const useUserMatchesActions = () =>
	useUserMatchesStore((state) => state.actions);
