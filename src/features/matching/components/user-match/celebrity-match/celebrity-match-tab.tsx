"use client";

import { Search, Star } from "lucide-react";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCelebMatch } from "@/features/matching/api/get-celeb-match";
import type { CelebMatch } from "@/features/matching/utils/transform-api-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CelebrityMatchCard } from "./celebrity-match-card";
import { CelebrityMatchCardSkeleton } from "./celebrity-match-card-skeleton";

interface CelebrityMatchTabProps {
	activePhotoId?: string | null;
}

export const CelebrityMatchTab = ({
	activePhotoId,
}: CelebrityMatchTabProps) => {
	const isMobile = useIsMobile();
	const { data: celebMatches, isLoading } = useCelebMatch({
		input: {
			faceId: activePhotoId || undefined,
			limit: 50,
		},
		queryConfig: {
			enabled: !!activePhotoId,
		},
	});
	const [selectedCelebrity, setSelectedCelebrity] =
		React.useState<CelebMatch | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCelebrities = (celebMatches ?? []).filter(
		(celebMatch) =>
			celebMatch.celeb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			celebMatch?.celeb?.school
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()),
	);

	return (
		<Card
			className={cn(
				"p-0 sm:p-6 border-0 shadow-none sm:shadow-soft bg-gradient-card",
				isMobile && "bg-transparent",
			)}
		>
			<div className="text-center mb-4 sm:mb-6">
				<div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
					<Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
				</div>
				<h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
					Celebrity Matches
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
					Discover which celebrities you look like most!
				</p>
			</div>

			{/* Search Bar */}
			<div className="relative mb-4 sm:mb-6">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
				<Input
					type="text"
					placeholder="Search celebrities..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>

			<div className="mb-8">
				<div className="space-y-3 sm:space-y-4">
					{isLoading ? (
						Array.from({ length: 3 }).map((_, index) => (
							<CelebrityMatchCardSkeleton key={index} />
						))
					) : filteredCelebrities.length > 0 ? (
						filteredCelebrities.map((celebMatch) => (
							<CelebrityMatchCard
								key={celebMatch.id}
								celebMatch={celebMatch}
								isSelected={selectedCelebrity?.id === celebMatch.id}
								onSelect={setSelectedCelebrity}
							/>
						))
					) : (
						<div className="text-center py-12">
							<Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
							<h3 className="text-xl font-semibold text-gray-600 mb-2">
								No Celebrity Matches Found
							</h3>
							<p className="text-gray-500">
								{searchTerm
									? "No celebrities found. Try a different search term!"
									: "We're still processing celebrity matches for you. Check back soon!"}
							</p>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
};
