"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MutationConfig } from "@/lib/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthActions } from "@/stores/auth-store";

export const signOutApi = async () => {
	return await supabase.auth.signOut();
};

type UseSignOutOptions = {
	mutationConfig?: MutationConfig<typeof signOutApi>;
};

export const useSignOut = ({ mutationConfig }: UseSignOutOptions = {}) => {
	const { reset } = useAuthActions();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: async (...args) => {
			reset();
			queryClient.clear();
			toast.success("Logged out successfully");
			onSuccess?.(...args);
		},
		onError: (error: Error, ...args) => {
			reset();
			toast.success("Logged out successfully");
			router.push("/auth/sign-in");
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: signOutApi,
	});
};
