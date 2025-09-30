/** biome-ignore-all lint/a11y/useKeyWithClickEvents: interactive elements with click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: interactive elements with click handlers */

import { Users } from "lucide-react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useUser } from "@/stores/auth-store";
import { UniversityMatchCard } from "./university-match-card";

export interface UniversityMatch {
	id: string;
	me: {
		name: string;
		image: string;
		age: number;
		school: string;
	};
	other: {
		name: string;
		image: string;
		age: number;
		school: string;
	};
	matchPercentage: number;
	numberOfMatches: number;
	timestamp: string;
	isNew: boolean;
	isFavorited?: boolean;
	matches: Array<{
		id: string;
		createdAt: string;
		name: string;
		image: string;
		school: string;
		reactions: Record<string, number>;
		matchPercentage: number;
		isNew?: boolean;
	}>;
}

const MatchCardSkeleton = () => (
	<div className="w-full p-4 sm:p-5 rounded-xl border-2 border-gray-200 bg-white">
		<div className="flex items-center gap-3 sm:gap-4">
			<Skeleton className="w-16 h-16 sm:w-18 sm:h-18 rounded-full" />
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between mb-2">
					<Skeleton className="h-5 w-32" />
					<div className="flex items-center gap-1 flex-shrink-0 ml-3">
						<Skeleton className="w-4 h-4 rounded-full" />
						<Skeleton className="h-5 w-10" />
					</div>
				</div>
				<Skeleton className="h-4 w-40" />
			</div>
			<Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-full" />
		</div>
	</div>
);

export const UniversityMatchTab = () => {
	const [selectedMatch, setSelectedMatch] =
		React.useState<UniversityMatch | null>(null);
	const user = useUser();
	const { matches: userMatches, isLoading } = useUserLiveMatches(user?.id);
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
					{isLoading ? (
						// Show skeleton cards while loading
						Array.from({ length: 3 }).map((_, index) => (
							<MatchCardSkeleton key={index} />
						))
					) : universityMatch.length > 0 ? (
						universityMatch.map((match) => {
							const isSelected = selectedMatch?.id === match.id;

							return (
								<UniversityMatchCard
									key={match.id}
									match={match}
									isSelected={isSelected}
									setSelectedMatch={setSelectedMatch}
								/>
							);
						})
					) : (
						<div className="text-center py-12">
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
