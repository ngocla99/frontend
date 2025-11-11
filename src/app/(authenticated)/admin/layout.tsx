import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();

	// Check authentication
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		redirect("/auth/sign-in");
	}

	// Fetch user profile to check role
	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", user.id)
		.single();

	if (profileError || !profile) {
		redirect("/");
	}

	// Check if user has admin role
	if (profile.role !== "admin") {
		// Redirect non-admin users to home page
		redirect("/");
	}

	return <>{children}</>;
}
