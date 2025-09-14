/** biome-ignore-all lint/a11y/useButtonType: <no reason> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <no reason> */

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import user1Image from "../assets/user1.jpg";
import user2Image from "../assets/user2.jpg";
import user3Image from "../assets/user3.jpg";
import user4Image from "../assets/user4.jpg";
import { CelebritySearch } from "../components/CelebritySearch";
import { CustomMatchUpload } from "../components/CustomMatchUpload";
import { EnhancedBabyGenerator } from "../components/EnhancedBabyGenerator";
import { EnhancedPhotoUpload } from "../components/EnhancedPhotoUpload";
import { FavoritesManager } from "../components/FavoritesManager";
import { LiveMatches } from "../components/LiveMatches";
import { MatchCard } from "../components/MatchCard";
import { PotentialMatches } from "../components/PotentialMatches";

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

const Index = () => {
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

	const handleViewMatch = (
		user1: { name: string; image: string },
		user2: { name: string; image: string },
	) => {
		setViewModalData({ user1, user2 });
		setViewModalOpen(true);
	};

	const loadMoreMatches = () => {
		setDisplayedMatches((prev) => prev + 3);
	};

	// Extended demo matches data for infinite scroll
	const allMatches = [
		{
			user1: { name: "Sophie", image: user1Image },
			user2: { name: "Jordan", image: user2Image },
			matchPercentage: 88,
			timestamp: "just now",
			isNew: false,
		},
		{
			user1: { name: "Casey", image: user3Image },
			user2: { name: "Zoe", image: user4Image },
			matchPercentage: 81,
			timestamp: "just now",
			isNew: false,
		},
		{
			user1: { name: "Sam", image: user2Image },
			user2: { name: "Zoe", image: user3Image },
			matchPercentage: 69,
			timestamp: "1m ago",
			isNew: true,
		},
		{
			user1: { name: "Alex", image: user1Image },
			user2: { name: "Jamie", image: user4Image },
			matchPercentage: 92,
			timestamp: "2m ago",
			isNew: true,
		},
		{
			user1: { name: "Taylor", image: user3Image },
			user2: { name: "Morgan", image: user2Image },
			matchPercentage: 76,
			timestamp: "5m ago",
			isNew: false,
		},
		{
			user1: { name: "Riley", image: user4Image },
			user2: { name: "Avery", image: user1Image },
			matchPercentage: 84,
			timestamp: "8m ago",
			isNew: false,
		},
		{
			user1: { name: "Quinn", image: user2Image },
			user2: { name: "Blake", image: user3Image },
			matchPercentage: 73,
			timestamp: "12m ago",
			isNew: false,
		},
		{
			user1: { name: "Drew", image: user1Image },
			user2: { name: "Sage", image: user4Image },
			matchPercentage: 89,
			timestamp: "15m ago",
			isNew: false,
		},
	];

	const matches = allMatches.slice(0, displayedMatches);

	return (
		<div className="min-h-screen bg-gradient-subtle">
			<div className="container mx-auto py-4 sm:py-6 lg:py-8">
				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
					{/* Left Column - Upload & Matching */}
					<div className="space-y-8">
						<div className="flex gap-4 items-center mb-4">
							<FavoritesManager onSelectMatch={handleSelectMatch} />
						</div>
						<EnhancedPhotoUpload
							onPhotoUpload={handlePhotoUpload}
							userPhoto={userPhoto}
						/>

						{/* Progressive Flow */}
						{userPhoto && !showBabyGenerator && (
							<div className="animate-fade-in">
								<Tabs
									value={activeTab}
									onValueChange={setActiveTab}
									className="w-full"
								>
									<TabsList className="grid w-full grid-cols-3 mb-8 bg-card border border-border">
										<TabsTrigger value="university" className="font-medium">
											University
										</TabsTrigger>
										<TabsTrigger value="celebrity" className="font-medium">
											Celebrities
										</TabsTrigger>
										<TabsTrigger value="custom" className="font-medium">
											Your Photos
										</TabsTrigger>
									</TabsList>

									<TabsContent value="university">
										<PotentialMatches
											userGender={userPhoto.gener}
											onSelectMatch={handleSeletMatch}
											selectedMatch={selectedMach}
										/>
									</TabsContent>

									<TabsContent value="celebrity">
										<CelebritySearch
											onSelectCelebrity={handleSelectCelebrity}
											selectedCelebrity={selectedCelebrity}
										/>
									</TabsContent>

									<TabsContent value="custom">
										<CustomMatchUpload
											onSelectCustomMatch={handleSelectCustomMatch}
											selectedCustomMatch={selectedCustomMatch}
										/>
									</TabsContent>
								</Tabs>
							</div>
						)}

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
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-display font-light text-foreground mb-2">
								Live University Matches
							</h2>
							<p className="text-muted-foreground mb-6">
								Real matches happening now
							</p>
							<LiveMatches
								activeUsers={345}
								newMatches={10}
								viewedMatches={14}
							/>
						</div>

						<div className="h-[600px] overflow-y-auto space-y-4 pr-2">
							{matches.map((match, index) => (
								<MatchCard
									key={index}
									user1={match.user1}
									user2={match.user2}
									matchPercentage={match.matchPercentage}
									timestamp={match.timestamp}
									isNew={match.isNew}
									onViewMatch={() => handleViewMatch(match.user1, match.user2)}
								/>
							))}
							{displayedMatches < allMatches.length && (
								<div className="text-center py-4">
									<button
										onClick={loadMoreMatches}
										className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
									>
										Load more matches...
									</button>
								</div>
							)}
						</div>
					</div>
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
};

export default Index;
