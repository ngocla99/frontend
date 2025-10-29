import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "../components/home-content";

export default async function HomePage() {
	const supabase = await createClient();

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		redirect("/auth/sign-in");
	}

	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	// TODO: Add a check for age
	const isOnboarding = profile && (!profile?.name || !profile?.gender);

	if (profileError || isOnboarding) {
		redirect("/onboarding");
	}

	return <HomeContent />;
}
