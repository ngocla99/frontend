import { redirect } from "next/navigation";
import { RootLayout } from "@/components/layout/root-layout";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated Layout
 *
 * This layout protects all routes under (authenticated)/ group.
 * It checks for valid user session and redirects to sign-in if not authenticated.
 *
 * Force-dynamic ensures:
 * - Fresh auth checks on every request
 * - User-specific data is never cached
 * - Cookies are sent with each request for session validation
 */

export default async function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		redirect("/auth/sign-in");
	}

	return <RootLayout>{children}</RootLayout>;
}

// Force dynamic rendering for all authenticated routes
// This ensures user-specific data is always fresh and never cached
export const dynamic = "force-dynamic";
