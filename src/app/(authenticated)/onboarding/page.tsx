"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/features/auth/api/get-me";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { useIsMobile } from "@/hooks/use-mobile";

export default function OnboardingPage() {
	const user = useUser();
	const isMobile = useIsMobile();

	useEffect(() => {
		if (user?.name && user?.school && user?.gender) {
			if (isMobile) {
				redirect("/your-matches");
			} else {
				redirect("/");
			}
		}
	}, [user, isMobile]);

	if (user?.name && user?.school && user?.gender) {
		return null;
	}

	return <OnboardingForm />;
}
