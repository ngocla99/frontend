import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/auth-store";

export const signOutApi = async (): Promise<void> => {
	return apiClient.post("/api/auth/logout");
};

type UseSignOutOptions = {
	mutationConfig?: MutationConfig<typeof signOutApi>;
};

export const useSignOut = ({ mutationConfig }: UseSignOutOptions = {}) => {
	const { reset } = useAuth();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: async (...args) => {
			await supabase.auth.signOut();
			toast.success("Logged out successfully");
			onSuccess?.(...args);
			reset();
			queryClient.clear();
			router.navigate({ to: "/auth/sign-in" });
		},
		onError: (error: Error, ...args) => {
			reset();
			toast.success("Logged out successfully");
			router.navigate({ to: "/auth/sign-in" });
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: signOutApi,
	});
};
