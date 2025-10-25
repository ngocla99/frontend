"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/stores/auth-store";

export default function OnboardingPage() {
	const user = useUser();
	const isMobile = useIsMobile();
	const router = useRouter();

	useEffect(() => {
		if (user?.name && user?.school && user?.gender) {
			if (isMobile) {
				router.push("/your-matches");
			} else {
				router.push("/");
			}
		}
	}, [user, isMobile, router]);

	if (user?.name && user?.school && user?.gender) {
		return null;
	}

	return <OnboardingForm />;
}
