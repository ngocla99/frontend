import { create } from "zustand";

export type UserUploadType = {
	gender: string;
	photo: string;
};
type UserUploadStore = {
	userUpload: UserUploadType;
	actions: {
		setUserUpload: (userUpload: UserUploadType) => void;
		clearUserUpload: () => void;
	};
};

const useUserUploadStore = create<UserUploadStore>()((set) => ({
	userUpload: {
		gender: "",
		photo: "",
	},
	actions: {
		setUserUpload: (userUpload) => {
			set({ userUpload });
		},
		clearUserUpload() {
			set({ userUpload: { gender: "", photo: "" } });
		},
	},
}));

export const useUserUpload = () =>
	useUserUploadStore((state) => state.userUpload);
export const useSettingActions = () =>
	useUserUploadStore((state) => state.actions);
