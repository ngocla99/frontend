import { create } from "zustand";
import type { UserApi } from "@/types/api";

type UserUploadStore = {
	userUpload: UserApi;
	actions: {
		setUserUpload: (userUpload: UserApi) => void;
		clearUserUpload: () => void;
	};
};

const initialUserUpload: UserApi = {
	user_id: "",
	default_face_id: "",
	username: "",
	email: "",
	avatar: "",
	gender: "",
	image_url: "",
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
