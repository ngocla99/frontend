import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import type { MutationConfig } from "@/lib/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Create magic link schema with dynamic validation
 * @param allowNonEduEmails - Whether to allow non-.edu emails (from database system_settings)
 */
export const createMagicLinkSchema = (allowNonEduEmails: boolean) =>
	z.object({
		email: z
			.string()
			.email("Please enter a valid email address")
			.refine((email) => {
				// If allow_non_edu_emails setting is enabled, allow all emails
				if (allowNonEduEmails) {
					return true;
				}

				// Otherwise, require .edu domains only
				const domain = email.toLowerCase().split("@")[1];
				if (!domain) return false;

				return domain.includes(".edu");
			}, "Please use a valid school email (.edu)"),
	});

// Default schema for production (only .edu)
export const magicLinkSchema = createMagicLinkSchema(false);

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/**
 * Sends a magic link to the user's email via Supabase
 */
export const sendMagicLinkApi = async (
	input: MagicLinkInput,
): Promise<{ message: string }> => {
	const supabase = createClient();

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
