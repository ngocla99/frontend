import { createFileRoute } from "@tanstack/react-router";

/** biome-ignore-all lint/a11y/useButtonType: <no reason> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <no reason> */

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { LiveMatch } from "@/features/matching/components/live-match/live-match";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";
import { EnhancedBabyGenerator } from "@/old/components/EnhancedBabyGenerator";
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
	const [userPhoto, setUserPhoto] = useState<{
		photo: string;
		gender: string;
	} | null>(null);
	const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(
		null,
	);
	const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(
		null,
	);
	const [selectedCustomMatch, setSelectedCustomMatch] =
		useState<CustomMatch | null>(null);
	const [showBabyGenerator, setShowBabyGenerator] = useState(false);
	const [displayedMatches, setDisplayedMatches] = useState(3);
	const [activeTab, setActiveTab] = useState("university");
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [viewModalData, setViewModalData] = useState<{
		user1: any;
		user2: any;
	} | null>(null);

	const handlePhotoUpload = (photo: string, gender: string) => {
		if (photo === "" && gender === "") {
			// Reset photo
			setUserPhoto(null);
			setSelectedMatch(null);
			setShowBabyGenerator(false);
			return;
		}
		setUserPhoto({ photo, gender });
	};

	const handleSelectMatch = (match: PotentialMatch) => {
		setSelectedMatch(match);
		setSelectedCelebrity(null);
		setSelectedCustomMatch(null);
		setShowBabyGenerator(true);
	};

	const handleSelectCelebrity = (celebrity: Celebrity) => {
		setSelectedCelebrity(celebrity);
		setSelectedMatch(null);
		setSelectedCustomMatch(null);
		setShowBabyGenerator(true);
	};

	const handleSelectCustomMatch = (customMatch: CustomMatch) => {
		setSelectedCustomMatch(customMatch);
		setSelectedMatch(null);
		setSelectedCelebrity(null);
		setShowBabyGenerator(true);
	};

	const handleBackToMatches = () => {
		setShowBabyGenerator(false);
		setSelectedMatch(null);
		setSelectedCelebrity(null);
		setSelectedCustomMatch(null);
	};

	const loadMoreMatches = () => {
		setDisplayedMatches((prev) => prev + 3);
	};

	const handleSeletMatch = (match: PotentialMatch) => {
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
						{userPhoto && !showBabyGenerator && <UserMatch />}

						{showBabyGenerator && (
							<div className="animate-fade-in">
								<EnhancedBabyGenerator
									userPhoto={userPhoto?.photo}
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
									onBack={handleBackToMatches}
								/>
							</div>
						)}
					</div>

					{/* Right Column - Infinite Live Feed */}
					<LiveMatch />
				</div>

				{/* View Match Modal */}
				<Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-center font-display text-2xl">
								{viewModalData?.user1.name} & {viewModalData?.user2.name}'s Baby
							</DialogTitle>
						</DialogHeader>
						{viewModalData && (
							<EnhancedBabyGenerator
								userPhoto={viewModalData.user1.image}
								matchPhoto={viewModalData.user2.image}
								matchName={viewModalData.user2.name}
								onBack={() => setViewModalOpen(false)}
							/>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
