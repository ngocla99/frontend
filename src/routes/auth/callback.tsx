import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OAuthCallback } from "@/features/auth/components/oauth-callback";

const authSearchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
	validateSearch: (search) => authSearchSchema.parse(search),
	component: OAuthCallback,
});
