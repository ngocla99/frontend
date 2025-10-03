import { createFileRoute, Navigate } from "@tanstack/react-router";
import React from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { LiveMatch } from "@/features/matching/components/live-match/live-match";
import { BabyGenerator } from "@/features/matching/components/match-dialog/baby-generator";
import { MatchDialog } from "@/features/matching/components/match-dialog/match-dialog";
import { MatchNavMobile } from "@/features/matching/components/match-nav-mobile";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/auth-store";

export const Route = createFileRoute("/")({
	component: HomePage,
});

interface PotentialMatch {
	id: string;
	name: string;
	image: string;
	age: number;
	university: string;
	major?: string;
	interests?: string[];
}

interface Celebrity {
	id: string;
	name: string;
	image: string;
	age: number;
	profession: string;
	category: string;
	popularity: number;
}

interface CustomMatch {
	id: string;
	name: string;
	image: string;
}

function HomePage() {
	const isMobile = useIsMobile();
	const user = useUser();

	const [selectedMatch, _setSelectedMatch] =
		React.useState<PotentialMatch | null>(null);
	const [selectedCelebrity, _setSelectedCelebrity] =
		React.useState<Celebrity | null>(null);
	const [selectedCustomMatch, _setSelectedCustomMatch] =
		React.useState<CustomMatch | null>(null);
	const [showBabyGenerator, setShowBabyGenerator] = React.useState(false);

	// TODO: Add a check for age
	const isOnboarding = user && (!user?.name || !user?.gender);

	// Check if user needs onboarding
	if (isOnboarding) {
		return <Navigate to="/onboarding" />;
	}

	return (
		<RootLayout>
			<main className="pt-24 min-h-screen bg-gradient-subtle px-4 sm:px-6 lg:px-8">
				<div className="container mx-auto pb-4 sm:pb-6 lg:pb-8">
					{/* Two Column Layout */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
						{!isMobile && (
							<div className="space-y-8 mx-0 sm:mx-4">
								<UploadPhoto className={cn(isMobile && !user && "hidden")} />

								{user?.image && <UserMatch />}

								{showBabyGenerator && (
									<div className="animate-fade-in">
										<BabyGenerator
											userPhoto={user?.image}
											matchPhoto={
												selectedMatch?.image ||
												selectedCelebrity?.image ||
												selectedCustomMatch?.image
											}
											matchName={
												selectedMatch?.name ||
												selectedCelebrity?.name ||
												selectedCustomMatch?.name
											}
											onBack={() => setShowBabyGenerator(false)}
										/>
									</div>
								)}
							</div>
						)}

						<LiveMatch />
					</div>

					<MatchDialog />
				</div>
				<MatchNavMobile />
			</main>
		</RootLayout>
	);
}
