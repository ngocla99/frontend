import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		// Supabase Server Configuration
		SUPABASE_SIGNED_URL_TTL: z.coerce.number().positive().default(86400),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
		// AI Services - Replicate
		REPLICATE_API_TOKEN: z.string().min(1),
		REPLICATE_MODEL_VERSION: z.string().min(1),
		// AI Services - Python (DEPRECATED, use Replicate instead)
		PYTHON_AI_SERVICE_URL: z.url().optional(),
		PYTHON_AI_SERVICE_API_KEY: z.string().min(1).optional(),
		// AI Services - FAL.AI
		FAL_AI_API_KEY: z.string().min(1),
		FAL_BABY_MODEL_ID: z.string().min(1).default("fal-ai/nano-banana/edit"),
		// Note: allow_non_edu_emails is now stored in database (system_settings table)
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BASE_API_URL: z.string().default("/api"),
		NEXT_PUBLIC_SUPABASE_URL: z.url(),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,

		// Server-side
		SUPABASE_SIGNED_URL_TTL: process.env.SUPABASE_SIGNED_URL_TTL,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
		REPLICATE_MODEL_VERSION: process.env.REPLICATE_MODEL_VERSION,
		PYTHON_AI_SERVICE_URL: process.env.PYTHON_AI_SERVICE_URL,
		PYTHON_AI_SERVICE_API_KEY: process.env.PYTHON_AI_SERVICE_API_KEY,
		FAL_AI_API_KEY: process.env.FAL_AI_API_KEY,
		FAL_BABY_MODEL_ID: process.env.FAL_BABY_MODEL_ID,

		// Client-side
		NEXT_PUBLIC_BASE_API_URL: process.env.NEXT_PUBLIC_BASE_API_URL,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	},

	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,

	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
