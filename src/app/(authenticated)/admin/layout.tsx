import { Gauge, Settings, ToggleLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { AdminSidebarNav } from "@/features/admin/components/admin-sidebar-nav";
import { createClient } from "@/lib/supabase/server";

const adminSidebarNavItems = [
	{
		title: "Matching Algorithm",
		href: "/admin/matching-algorithm",
		icon: <Settings size={18} />,
	},
	{
		title: "Rate Limits",
		href: "/admin/rate-limits",
		icon: <Gauge size={18} />,
	},
	{
		title: "Feature Toggles",
		href: "/admin/feature-toggles",
		icon: <ToggleLeft size={18} />,
	},
];

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

	return (
		<div className="relative flex w-full flex-1 flex-col h-[100vh]">
			<main className="container pt-24 px-4 sm:px-6 lg:px-8 flex grow flex-col overflow-hidden mx-auto max-w-6xl">
				<div className="space-y-0.5">
					<h1 className="text-2xl font-bold tracking-tight md:text-3xl">
						Admin Settings
					</h1>
					<p className="text-muted-foreground">
						Manage system settings and configure application behavior.
					</p>
				</div>
				<Separator className="my-4 lg:my-6" />
				<div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
					<aside className="top-0 lg:sticky lg:w-1/5">
						<AdminSidebarNav items={adminSidebarNavItems} />
					</aside>
					<div className="flex w-full overflow-y-hidden p-1">{children}</div>
				</div>
			</main>
		</div>
	);
}
