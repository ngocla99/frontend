"use client";

import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/stores/auth-store";
import { redirect } from "next/navigation";
import { useEffect } from "react";

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
