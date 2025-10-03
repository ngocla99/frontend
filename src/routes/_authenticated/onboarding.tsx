import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/stores/auth-store";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const user = useUser();
  const isMobile = useIsMobile();

  if (user?.name && user?.school && user?.gender) {
    if (isMobile) {
      return <Navigate to="/your-matches" />;
    }

    return <Navigate to="/" />;
  }

  return <OnboardingForm />;
}
