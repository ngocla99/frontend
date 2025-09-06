import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
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

	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (...args) => {
			onSuccess?.(...args);
			reset();
			toast.success("Logged out successfully");
			router.navigate({ to: "/" });
		},
		onError: (error: Error, ...args) => {
			reset();
			toast.success("Logged out successfully");
			router.navigate({ to: "/" });
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: signOutApi,
	});
};
