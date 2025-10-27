import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Protected routes that require authentication
const protectedRoutes = [
  "/live-matches",
  "/your-matches",
  "/profile",
  "/onboarding",
];

export async function proxy(request: NextRequest) {
  // First, update the Supabase session (refresh tokens if needed)
  const supabaseResponse = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  // Check authentication by reading cookies from the response
  // Extract user info from the updated session cookies
  const authCookie = supabaseResponse.cookies
    .getAll()
    .find((cookie) => cookie.name.includes("auth-token"));
  console.log("🚀 ~ proxy ~ authCookie:", authCookie);

  // Redirect to sign-in if not authenticated
  if (!authCookie) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return supabaseResponse;
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
