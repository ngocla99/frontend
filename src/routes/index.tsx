import { createFileRoute } from "@tanstack/react-router";

/** biome-ignore-all lint/a11y/useButtonType: <no reason> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <no reason> */

import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useMe } from "@/features/auth/api/get-me";
import { useFaces } from "@/features/matching/api/get-faces";
import { LiveMatch } from "@/features/matching/components/live-match/live-match";
import { EnhancedBabyGenerator } from "@/features/matching/components/match-dialog/baby-generator";
import { MatchDialog } from "@/features/matching/components/match-dialog/match-dialog";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";
import { useUserMatchesOpen } from "@/features/matching/store/user-matches";
import {
	useUserUpload,
	useUserUploadActions,
} from "@/features/matching/store/user-upload";
import { FavoritesManager } from "@/old/components/FavoritesManager";

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
	const { data: user } = useMe();
	const { data: faces } = useFaces();

	const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(
		null,
	);
	const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(
		null,
	);
	const [selectedCustomMatch, setSelectedCustomMatch] =
		useState<CustomMatch | null>(null);
	const [showBabyGenerator, setShowBabyGenerator] = useState(false);

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

	return (
		<div className="pt-20 min-h-screen bg-gradient-subtle">
			<div className="container mx-auto py-4 sm:py-6 lg:py-8">
				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
					{/* Left Column - Upload & Matching */}
					<div className="space-y-8">
						<div className="flex gap-4 items-center mb-4">
							<FavoritesManager onSelectMatch={handleSelectMatch} />
						</div>
						<UploadPhoto />

						{/* Progressive Flow */}
						{userUpload.photo && !showBabyGenerator && <UserMatch />}

						{showBabyGenerator && (
							<div className="animate-fade-in">
								<EnhancedBabyGenerator
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

					{/* Right Column - Infinite Live Feed */}
					<LiveMatch />
				</div>

				<MatchDialog />
			</div>
		</div>
	);
}
