import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "./error-handler";

/**
 * Profile data from the database
 */
export type Profile = {
	id: string;
	email: string;
	name: string | null;
	gender: string | null;
	school: string | null;
	default_face_id: string | null;
	role: string;
	created_at: string;
	updated_at: string;
};

/**
 * Session context provided to route handlers
 */
export type Session = {
	user: User;
	profile: Profile;
};

/**
 * Handler function signature for withSession
 */
type WithSessionHandler = (context: {
	request: NextRequest;
	params: Record<string, string>;
	searchParams: Record<string, string>;
	session: Session;
	supabase: SupabaseClient;
}) => Promise<Response>;
/**
 * Middleware wrapper for Next.js API routes that:
 * 1. Validates Supabase JWT authentication
 * 2. Pre-fetches user profile from database
 * 3. Provides typed session context to handlers
 * 4. Handles authentication errors consistently
 *
 * Note: Profile creation is handled by the /api/auth/me endpoint.
 * If a profile doesn't exist, this middleware will return a 404 error.
 *
 * @example
 * ```ts
 * export const GET = withSession(async ({ request, session, supabase }) => {
 *   // session.user and session.profile are pre-loaded and typed
 *   return NextResponse.json({ user: session.profile });
 * });
 * ```
 */
export const withSession = (handler: WithSessionHandler) => {
	return async (
		request: NextRequest,
		context?: { params: Promise<Record<string, string>> },
	) => {
		try {
			// Create Supabase client
			const supabase = await createClient();

			// Validate authentication
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError || !user) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}

			// Fetch user profile from database
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			// Return error if profile doesn't exist
			if (profileError || !profile) {
				return NextResponse.json(
					{
						error:
							"Profile not found. Please complete onboarding at /api/auth/me",
					},
					{ status: 404 },
				);
			}

			// Parse URL search params
			const url = new URL(request.url);
			const searchParams: Record<string, string> = {};
			url.searchParams.forEach((value, key) => {
				searchParams[key] = value;
			});

			// Resolve route params (if any)
			const params = context?.params ? await context.params : {};

			// Call the handler with session context
			return await handler({
				request,
				params,
				searchParams,
				session: {
					user,
					profile,
				},
				supabase,
			});
		} catch (error) {
			return handleApiError(error);
		}
	};
};
