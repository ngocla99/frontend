import { redirect } from "next/navigation";
import { RootLayout } from "@/components/layout/root-layout";
import { createClient } from "@/lib/supabase/server";

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
