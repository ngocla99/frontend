/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */

import { Heart, Search, Star } from "lucide-react";
import React, { useState } from "react";
import { ImageLoader } from "@/components/image-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCelebLiveMatches } from "@/features/matching/hooks/use-celeb-live-matches";
import type { CelebMatch } from "@/features/matching/utils/transform-api-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/auth-store";

interface CelebrityMatchTabProps {
	activePhotoId?: string | null;
}

export const CelebrityMatchTab = ({
	activePhotoId,
}: CelebrityMatchTabProps) => {
	const isMobile = useIsMobile();
	const user = useUser();
	const { matches: celebMatches, isLoading } = useCelebLiveMatches(
		user?.id,
		activePhotoId,
	);
	const [selectedCelebrity, setSelectedCelebrity] =
		React.useState<CelebMatch | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCelebrities = celebMatches.filter(
		(celebMatch) =>
			celebMatch.celeb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(celebMatch.celeb.school &&
				celebMatch.celeb.school
					.toLowerCase()
					.includes(searchTerm.toLowerCase())),
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
					Find your celebrity look-alike and see your baby!
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
							<div
								key={index}
								className="w-full p-4 sm:p-5 rounded-xl border-2 border-gray-200 bg-white animate-pulse"
							>
								<div className="flex items-center gap-3 sm:gap-4">
									<div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-200" />
									<div className="flex-1 min-w-0">
										<div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
										<div className="h-3 bg-gray-200 rounded w-2/3" />
									</div>
									<div className="h-8 w-20 bg-gray-200 rounded-full" />
								</div>
							</div>
						))
					) : filteredCelebrities.length > 0 ? (
						filteredCelebrities.map((celebMatch) => {
							const isSelected = selectedCelebrity?.id === celebMatch.id;

							return (
								<div
									key={celebMatch.id}
									className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer hover:shadow-lg ${
										isSelected
											? "border-pink-300 bg-pink-50 shadow-md"
											: "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-25"
									}`}
									onClick={() => setSelectedCelebrity(celebMatch)}
								>
									<div className="flex items-center gap-3 sm:gap-4">
										<ImageLoader
											src={celebMatch.celeb.image}
											alt={celebMatch.celeb.name}
											width={72}
											height={72}
											className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 border-white shadow-md"
										/>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1 sm:mb-2">
												<h3 className="font-bold text-foreground text-sm sm:text-base truncate">
													{celebMatch.celeb.name}
												</h3>
												<div className="flex items-center gap-1 flex-shrink-0 ml-2">
													<Heart className="w-3 h-3 sm:w-4 sm:h-4 text-love" />
													<span className="font-bold text-love text-sm sm:text-base">
														{celebMatch.matchPercentage}%
													</span>
												</div>
											</div>

											<p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate">
												Celebrity • {celebMatch.timestamp}
											</p>
										</div>

										<div className="text-center flex-shrink-0">
											<Button
												variant="ghost"
												size="sm"
												className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-sm h-8 sm:h-10 px-3 sm:px-4 font-semibold rounded-full gap-0"
											>
												<span className="hidden sm:inline mr-1">See </span>Baby
											</Button>
										</div>
									</div>
								</div>
							);
						})
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
