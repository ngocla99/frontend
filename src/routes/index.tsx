import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useMe } from "@/features/auth/api/get-me";
import { useFaces } from "@/features/matching/api/get-faces";
import { FavoriteHistory } from "@/features/matching/components/favorite-history/favorite-history";
import { LiveMatch } from "@/features/matching/components/live-match/live-match";
import { BabyGenerator } from "@/features/matching/components/match-dialog/baby-generator";
import { MatchDialog } from "@/features/matching/components/match-dialog/match-dialog";
import { MatchingSkeleton } from "@/features/matching/components/matching-skeleton";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";
import {
	useUserUpload,
	useUserUploadActions,
} from "@/features/matching/store/user-upload";

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
	const userUpload = useUserUpload();
	const { setUserUpload } = useUserUploadActions();
	const { data: user, isLoading: isUserLoading } = useMe();
	const { data: faces, isLoading: isFacesLoading } = useFaces();

	const [selectedMatch, setSelectedMatch] =
		React.useState<PotentialMatch | null>(null);
	const [selectedCelebrity, setSelectedCelebrity] =
		React.useState<Celebrity | null>(null);
	const [selectedCustomMatch, setSelectedCustomMatch] =
		React.useState<CustomMatch | null>(null);
	const [showBabyGenerator, setShowBabyGenerator] = React.useState(false);

	React.useEffect(() => {
		if (!user || !faces) return;
		setUserUpload({
			...user,
			photo: faces.find((face) => face.face_id === user.default_face_id)
				?.image_url,
		});
	}, [faces, user]);

	const handleSelectMatch = (match: PotentialMatch) => {
		setSelectedMatch(match);
		setSelectedCelebrity(null);
		setSelectedCustomMatch(null);
		setShowBabyGenerator(true);
	};

	// Show loading state when either API is loading
	if (isUserLoading || isFacesLoading) {
		return <MatchingSkeleton />;
	}

	return (
		<div className="pt-20 min-h-screen bg-gradient-subtle">
			<div className="container mx-auto py-4 sm:py-6 lg:py-8">
				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
					<div className="space-y-8">
						<div className="flex gap-4 items-center mb-4">
							<FavoriteHistory onSelectMatch={handleSelectMatch} />
						</div>
						<UploadPhoto />

						{userUpload.photo && !showBabyGenerator && <UserMatch />}

						{showBabyGenerator && (
							<div className="animate-fade-in">
								<BabyGenerator
									userPhoto={userUpload.photo}
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
