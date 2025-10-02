import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/**
 * Sends a magic link to the user's email via backend
 */
export const sendMagicLinkApi = async (
	input: MagicLinkInput,
): Promise<{ message: string }> => {
	// Backend automatically configures the redirect URL to /auth/confirm
	// and will redirect to frontend /auth/callback with JWT after verification
	return apiClient.post("/api/auth/magic-link", {
		email: input.email,
	});
};

type UseSendMagicLinkOptions = {
	mutationConfig?: MutationConfig<typeof sendMagicLinkApi>;
};

export const useSendMagicLink = ({
	mutationConfig,
}: UseSendMagicLinkOptions = {}) => {
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (data, ...args) => {
			onSuccess?.(data, ...args);
			toast.success("Magic link sent! Check your email to sign in.");
		},
		onError: (error: Error, ...args) => {
			const errorMessage = error.message || "Failed to send magic link";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: sendMagicLinkApi,
	});
};
