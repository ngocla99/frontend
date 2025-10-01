import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MagicLinkCallback } from "@/features/auth/components/magic-link-callback";

const authSearchSchema = z.object({
	token: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
	validateSearch: (search) => authSearchSchema.parse(search),
	component: MagicLinkCallback,
});
