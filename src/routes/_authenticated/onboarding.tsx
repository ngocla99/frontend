import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMe } from "@/features/auth/api/get-me";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { MatchingSkeleton } from "@/features/matching/components/matching-skeleton";

export const Route = createFileRoute("/_authenticated/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const { data: user, isLoading } = useMe();

	if (isLoading) {
		return <MatchingSkeleton />;
	}

	if (user?.name && user?.school && user?.gender) {
		return <Navigate to="/" />;
	}

	return <OnboardingForm />;
}
