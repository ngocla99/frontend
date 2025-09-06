import Cookies from "js-cookie";
import { create } from "zustand";
import type { UserApi } from "@/types/api";

const ACCESS_TOKEN = "access_token";

interface AuthState {
	auth: {
		user: UserApi | null;
		setUser: (user: UserApi | null) => void;
		accessToken: string;
		setAccessToken: (accessToken: string) => void;
		resetAccessToken: () => void;
		reset: () => void;
	};
}

export const useAuthStore = create<AuthState>()((set) => {
	const cookieState = Cookies.get(ACCESS_TOKEN);
	const initToken = cookieState ? JSON.parse(cookieState) : "";
	return {
		auth: {
			user: null,
			setUser: (user) =>
				set((state) => ({ ...state, auth: { ...state.auth, user } })),
			accessToken: initToken,
			setAccessToken: (accessToken) =>
				set((state) => {
					Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken));
					return { ...state, auth: { ...state.auth, accessToken } };
				}),
			resetAccessToken: () =>
				set((state) => {
					Cookies.remove(ACCESS_TOKEN);
					return { ...state, auth: { ...state.auth, accessToken: "" } };
				}),
			reset: () =>
				set((state) => {
					Cookies.remove(ACCESS_TOKEN);
					return {
						...state,
						auth: { ...state.auth, user: null, accessToken: "" },
					};
				}),
		},
	};
});

export const useAuth = () => useAuthStore((state) => state.auth);
export const useUser = () => useAuthStore((state) => state.auth.user);
