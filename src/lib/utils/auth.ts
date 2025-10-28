import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Extracts the Supabase project reference from the NEXT_PUBLIC_SUPABASE_URL
 * @param supabaseUrl - The Supabase URL (e.g., https://lsbzbltpmmtplakdrjvq.supabase.co)
 * @returns The project reference (e.g., lsbzbltpmmtplakdrjvq)
 */
export const getSupabaseProjectRef = (supabaseUrl: string): string => {
	try {
		const url = new URL(supabaseUrl);
		const hostname = url.hostname;
		const projectRef = hostname.split(".")[0];
		return projectRef;
	} catch (_error) {
		throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
	}
};

/**
 * Generates the Supabase auth token cookie name from the project URL
 * @param supabaseUrl - The Supabase URL from NEXT_PUBLIC_SUPABASE_URL
 * @returns The cookie name in format: sb-{project-ref}-auth-token
 */
export const getAuthTokenCookieName = (supabaseUrl: string): string => {
	const projectRef = getSupabaseProjectRef(supabaseUrl);
	return `sb-${projectRef}-auth-token`;
};

// Use the environment variable to generate the cookie name dynamically
export const AUTH_TOKEN_COOKIE_NAME = getAuthTokenCookieName(
	env.NEXT_PUBLIC_SUPABASE_URL,
);

export const checkLoggedIn = async () => {
	const cookieStore = await cookies();
	const isLoggedIn = !!cookieStore.get(AUTH_TOKEN_COOKIE_NAME);
	return isLoggedIn;
};
