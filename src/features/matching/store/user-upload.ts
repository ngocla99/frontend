import { create } from "zustand";
import { UserApi } from "@/types/api";

export type UserUploadType = UserApi & {
	photo?: string;
};
type UserUploadStore = {
	userUpload: UserUploadType;
	actions: {
		setUserUpload: (userUpload: UserUploadType) => void;
		clearUserUpload: () => void;
	};
};

const initialUserUpload: UserUploadType = {
	username: "",
	email: "",
	avatar: "",
	gender: "",
	photo: "",
};

const useUserUploadStore = create<UserUploadStore>()((set) => ({
	userUpload: initialUserUpload,
	actions: {
		setUserUpload: (userUpload) => {
			set({ userUpload });
		},
		clearUserUpload() {
			set({ userUpload: initialUserUpload });
		},
	},
}));

export const useUserUpload = () =>
	useUserUploadStore((state) => state.userUpload);
export const useUserUploadActions = () =>
	useUserUploadStore((state) => state.actions);
