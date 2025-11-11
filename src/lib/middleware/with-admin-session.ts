import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { type Session, withSession } from "./with-session";

/**
 * Handler function signature for withAdminSession
 */
type WithAdminSessionHandler = (context: {
	request: NextRequest;
	params: Record<string, string>;
	searchParams: Record<string, string>;
	session: Session;
	supabase: SupabaseClient;
}) => Promise<Response>;

/**
 * Middleware wrapper for Next.js API routes that:
 * 1. Validates Supabase JWT authentication (via withSession)
 * 2. Pre-fetches user profile from database (via withSession)
 * 3. Validates that user has admin role
 * 4. Provides typed session context to handlers
 *
 * @example
 * ```ts
 * export const GET = withAdminSession(async ({ request, session, supabase }) => {
 *   // session.profile.role === 'admin' is guaranteed
 *   return NextResponse.json({ settings: [...] });
 * });
 * ```
 */
export const withAdminSession = (handler: WithAdminSessionHandler) => {
	return withSession(async (context) => {
		// Check if user has admin role
		if (context.session.profile.role !== "admin") {
			return NextResponse.json(
				{
					error: "Forbidden: Admin access required",
					message: "You do not have permission to access this resource",
				},
				{ status: 403 },
			);
		}

		// User is admin, proceed with handler
		return await handler(context);
	});
};
