"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/stores/auth-store";

export default function HomePage() {
	const router = useRouter();
	const session = useSession();

	useEffect(() => {
		if (session) {
			router.push("/live-matches");
		} else {
			router.push("/auth/sign-in");
		}
	}, [session, router]);

	return null; // or a loading spinner
}
