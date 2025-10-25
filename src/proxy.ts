import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Protected routes that require authentication
const protectedRoutes = [
	"/live-matches",
	"/your-matches",
	"/profile",
	"/onboarding",
];

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if route is protected
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtectedRoute) {
		return NextResponse.next();
	}

	// Check authentication
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// Redirect to sign-in if not authenticated
	if (!session) {
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico (favicon)
		 * - public files (public folder)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
