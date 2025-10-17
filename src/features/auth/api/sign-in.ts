import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import { useAuthActions } from "@/stores/auth-store";

export const signInSchema = z.object({
	email: z
		.string()
		.min(1, { message: "emailRequired" })
		.email({ message: "invalidEmail" }),
	password: z
		.string()
		.min(1, { message: "passwordRequired" })
		.min(7, { message: "passwordMinLength" }),
});

export type SignInInput = z.infer<typeof signInSchema>;

// biome-ignore lint/suspicious/noExplicitAny: <no need check>
export const signInApi = (input: SignInInput): Promise<any> => {
	return apiClient.post("/login", input);
};

type UseSignInOptions = {
	mutationConfig?: MutationConfig<typeof signInApi>;
};

export const useSignIn = ({ mutationConfig }: UseSignInOptions = {}) => {
	const { setAccessToken } = useAuthActions();
	const router = useRouter();

	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (...args) => {
			onSuccess?.(...args);
			const [data] = args;
			setAccessToken(data.accessToken);
			toast.success("Login success");
			router.navigate({ to: "/" });
		},
		onError: (error: Error, ...args) => {
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.message
					: "Login failed";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: signInApi,
	});
};
