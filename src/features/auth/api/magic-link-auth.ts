import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import type { MutationConfig } from "@/lib/react-query";
import { supabase } from "@/lib/supabase";

export const magicLinkSchema = z.object({
	email: z
		.string()
		.email("Please enter a valid email address")
		.refine((email) => {
			const domain = email.toLowerCase().split("@")[1];
			if (!domain) return false;

			// Check if domain contains .edu
			if (domain.includes(".edu")) return true;

			// Check whitelist domains from env
			const whitelist = import.meta.env.VITE_WHITELIST_EMAIL_DOMAINS || "";
			const whitelistDomains = whitelist
				.split(",")
				.map((d: string) => d.trim().toLowerCase())
				.filter(Boolean);

			return whitelistDomains.some(
				(whitelistDomain: string) => domain === whitelistDomain,
			);
		}, "Please use a valid school email"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/**
 * Sends a magic link to the user's email via Supabase
 */
export const sendMagicLinkApi = async (
	input: MagicLinkInput,
): Promise<{ message: string }> => {
	const { error } = await supabase.auth.signInWithOtp({
		email: input.email,
		options: {
			emailRedirectTo: `${window.location.origin}/auth/callback`,
			shouldCreateUser: true,
		},
	});

	if (error) {
		throw new Error(error.message);
	}

	return { message: "Magic link sent" };
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
