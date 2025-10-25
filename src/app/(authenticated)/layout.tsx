"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { useSession } from "@/stores/auth-store";

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!session) {
			router.push("/auth/sign-in");
		}
	}, [session, router]);

	if (!session) {
		return null; // or loading spinner
	}

	return <RootLayout>{children}</RootLayout>;
}
