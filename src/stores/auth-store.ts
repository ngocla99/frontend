import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { UserApi } from "@/types/api";
import STORE_NAME from "./store-name";

interface AuthState {
	// State
	user: UserApi | null;
	session: Session | null;
	accessToken: string; // Legacy support for OAuth flow

	// Actions
	actions: {
		setUser: (user: UserApi | null) => void;
		setSession: (session: Session | null) => void;
		setAccessToken: (accessToken: string) => void; // Legacy support
		reset: () => void;
		initialize: () => Promise<void>;
	};
}

const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			// State
			user: null,
			session: null,
			accessToken: "",

			// Actions
			actions: {
				setUser: (user) => set({ user }),
				setSession: (session) => set({ session }),
				setAccessToken: (accessToken) => set({ accessToken }),
				reset: () => set({ user: null, session: null, accessToken: "" }),
				initialize: async () => {
					// Create Supabase client using SSR pattern
					const supabase = createClient();

					// Get initial session from Supabase
					const {
						data: { session },
					} = await supabase.auth.getSession();
					set({ session });

					// Listen for auth state changes
					supabase.auth.onAuthStateChange((_event, session) => {
						set({ session });
					});
				},
			},
		}),
		{
			name: STORE_NAME.AUTH,
			storage: createJSONStorage(() =>
				typeof window !== "undefined"
					? localStorage
					: {
							getItem: () => null,
							setItem: () => {},
							removeItem: () => {},
						},
			),
			partialize: (state) => ({
				user: state.user,
				session: state.session,
				accessToken: state.accessToken,
			}),
		},
	),
);

// Export atomic selectors
export const useUser = () => useAuthStore((state) => state.user);

// Export raw store only for getState() usage in non-React contexts
export { useAuthStore };
