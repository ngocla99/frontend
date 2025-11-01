"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUserMatch } from "@/features/matching/api/get-user-match";
import { useMatchId } from "@/features/matching/store/user-matches";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { UniversityMatchCard } from "./university-match-card";
import { UniversityMatchSkeleton } from "./university-match-skeleton";

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

interface UniversityMatchTabProps {
	activePhotoId?: string | null;
}

export const UniversityMatchTab = ({
	activePhotoId,
}: UniversityMatchTabProps) => {
	const isMobile = useIsMobile();
	const matchId = useMatchId();
	const { data: userMatches, isLoading } = useUserMatch({
		input: {
			faceId: activePhotoId!,
			limit: 50,
			skip: 0,
		},
		queryConfig: {
			enabled: !!activePhotoId,
		},
	});

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
					{universityMatch.length > 0 && (
						<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
							Click on someone to see your baby together!
						</p>
					)}
				</div>

				{/* Matches List */}
				<div className="space-y-4 mb-8">
					{isLoading ? (
						Array.from({ length: 3 }).map((_, index) => (
							<UniversityMatchSkeleton key={index} />
						))
					) : universityMatch.length > 0 ? (
						universityMatch.map((match) => {
							const isSelected = matchId === match.id;

							return (
								<UniversityMatchCard
									key={match.id}
									match={match}
									isSelected={isSelected}
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
