import type { Session } from "@supabase/supabase-js";
import Cookies from "js-cookie";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { UserApi } from "@/types/api";

const ACCESS_TOKEN = "access_token";

interface AuthState {
	auth: {
		user: UserApi | null;
		session: Session | null;
		accessToken: string; // Legacy support for OAuth flow
		setUser: (user: UserApi | null) => void;
		setSession: (session: Session | null) => void;
		setAccessToken: (accessToken: string) => void; // Legacy support
		reset: () => void;
		initialize: () => Promise<void>;
	};
}

export const useAuthStore = create<AuthState>()((set) => {
	// Check for legacy OAuth token in cookies
	const cookieState = Cookies.get(ACCESS_TOKEN);
	const initToken = cookieState ? JSON.parse(cookieState) : "";

	return {
		auth: {
			user: null,
			session: null,
			accessToken: initToken,
			setUser: (user) =>
				set((state) => ({ ...state, auth: { ...state.auth, user } })),
			setSession: (session) =>
				set((state) => ({ ...state, auth: { ...state.auth, session } })),
			setAccessToken: (accessToken) =>
				set((state) => {
					// Legacy support for OAuth flow
					Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken));
					return { ...state, auth: { ...state.auth, accessToken } };
				}),
			reset: () =>
				set((state) => {
					Cookies.remove(ACCESS_TOKEN);

					return {
						...state,
						auth: { ...state.auth, user: null, session: null, accessToken: "" },
					};
				}),
			initialize: async () => {
				// Get initial session from Supabase
				const {
					data: { session },
				} = await supabase.auth.getSession();
				set((state) => ({ ...state, auth: { ...state.auth, session } }));

				// Listen for auth state changes
				supabase.auth.onAuthStateChange((_event, session) => {
					set((state) => ({ ...state, auth: { ...state.auth, session } }));
				});
			},
		},
	};
});

export const useAuth = () => useAuthStore((state) => state.auth);
export const useUser = () => useAuthStore((state) => state.auth.user);
export const useSession = () => useAuthStore((state) => state.auth.session);
