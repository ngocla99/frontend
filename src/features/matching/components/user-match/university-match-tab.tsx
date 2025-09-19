/** biome-ignore-all lint/a11y/useKeyWithClickEvents: interactive elements with click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: interactive elements with click handlers */

import { Heart, Users, Zap } from "lucide-react";
import React from "react";
import { ImageLoader } from "@/components/image-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface UniversityMatch {
	user: {
		name: string;
		image: string;
		age: number;
		university: string;
	};
	target_face_id?: string;
	matchPercentage: number;
	timestamp: string;
	isNew: boolean;
	isViewed: boolean;
}

export const UniversityMatchTab = () => {
	const [selectedMatch, setSelectedMatch] =
		React.useState<UniversityMatch | null>(null);
	const { matches: userMatches } = useUserLiveMatches();
	const isMobile = useIsMobile();

	const universityMatch: UniversityMatch[] =
		userMatches && userMatches.length > 0 ? userMatches : [];

	return (
		<div className="w-full max-w-4xl mx-auto">
			<Card
				className={cn(
					"p-0 sm:p-6 border-0 shadow-none sm:shadow-soft bg-gradient-card",
					isMobile && "bg-transparent",
				)}
			>
				{/* Header Section */}
				<div className="text-center mb-8">
					<div className="size-12 sm:size-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
						<Users className="w-6 sm:w-8 text-white" />
					</div>
					<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
						Your Potential Matches
					</h2>
					<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
						Click on someone to see your baby together!
					</p>
				</div>

				{/* Matches List */}
				<div className="space-y-4 mb-8">
					{universityMatch.length > 0 ? (
						universityMatch.map((match) => {
							const isSelected = selectedMatch?.user.name === match.user.name;

							return (
								<div
									key={match.user.name}
									className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer hover:shadow-lg ${
										isSelected
											? "border-pink-300 bg-pink-50 shadow-md"
											: "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-25"
									}`}
									onClick={() => setSelectedMatch(match)}
								>
									<div className="flex items-center gap-4">
										<ImageLoader
											src={match.user.image}
											alt={match.user.name}
											width={72}
											height={72}
											className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 border-white shadow-md"
										/>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-2">
												<h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
													{match.user.name}, {match.user.age}
												</h3>
												<div className="flex items-center gap-1 flex-shrink-0 ml-3">
													<Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
													<span className="font-bold text-pink-500 text-base sm:text-lg">
														{match.matchPercentage}%
													</span>
												</div>
											</div>
											<p className="text-sm sm:text-base text-gray-600 truncate">
												{match.user.university}
											</p>
										</div>

										<Button
											variant="ghost"
											size="sm"
											className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 text-sm h-8 sm:h-10 px-3 sm:px-4 font-semibold rounded-full gap-0"
										>
											<span className="hidden sm:inline mr-1">View </span>
											Baby
										</Button>
									</div>
								</div>
							);
						})
					) : (
						<div className="text-center py-12">
							<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
								<Users className="w-8 h-8 text-gray-400" />
							</div>
							<h3 className="text-xl font-semibold text-gray-600 mb-2">
								No Matches Found
							</h3>
							<p className="text-gray-500">
								We're still processing matches for you. Check back soon!
							</p>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
};
