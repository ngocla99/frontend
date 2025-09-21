import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useMe } from "@/features/auth/api/get-me";
import { LiveMatch } from "@/features/matching/components/live-match/live-match";
import { BabyGenerator } from "@/features/matching/components/match-dialog/baby-generator";
import { MatchDialog } from "@/features/matching/components/match-dialog/match-dialog";
import { MatchingSkeleton } from "@/features/matching/components/matching-skeleton";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";

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
	const { data: user, isLoading: isUserLoading } = useMe();

	const [selectedMatch, setSelectedMatch] =
		React.useState<PotentialMatch | null>(null);
	const [selectedCelebrity, setSelectedCelebrity] =
		React.useState<Celebrity | null>(null);
	const [selectedCustomMatch, setSelectedCustomMatch] =
		React.useState<CustomMatch | null>(null);
	const [showBabyGenerator, setShowBabyGenerator] = React.useState(false);

	if (isUserLoading) {
		return <MatchingSkeleton />;
	}

	return (
		<div className="pt-24 min-h-screen bg-gradient-subtle px-4 sm:px-6 lg:px-8">
			<div className="container mx-auto pb-4 sm:pb-6 lg:pb-8">
				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
					<div className="space-y-8 mx-0 sm:mx-4">
						<UploadPhoto />

						{user?.image && !showBabyGenerator && <UserMatch />}

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

					<LiveMatch />
				</div>

				<MatchDialog />
			</div>
		</div>
	);
}
