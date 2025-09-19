/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { Heart, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";

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

interface UniversityMatchProps {
	onSelectMatch: (match: UniversityMatch) => void;
	selectedMatch?: UniversityMatch;
}

export const UniversityMatchTab = ({
	onSelectMatch,
	selectedMatch,
}: UniversityMatchProps) => {
	const { matches: userMatches } = useUserLiveMatches();

	const universityMatch: UniversityMatch[] =
		userMatches && userMatches.length > 0 ? userMatches : [];

	return (
		<Card className="p-4 sm:p-6 bg-gradient-card shadow-soft border-0 hover:shadow-match transition-all duration-300">
			<div className="text-center mb-4 sm:mb-6">
				<div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
					<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
				</div>
				<h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
					Your Potential Matches
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
					Click on someone to see your baby together!
				</p>
			</div>

			<div className="space-y-3 sm:space-y-4">
				{universityMatch.length > 0 ? (
					universityMatch.map((match) => {
						const isSelected = selectedMatch?.user.name === match.user.name;

						return (
							<div
								key={match.user.name}
								className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all hover:shadow-match text-left ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
								onClick={() => onSelectMatch(match)}
							>
								<div className="flex items-center gap-3 sm:gap-4">
									<div className="relative">
										<img
											src={match.user.image}
											alt={match.user.name}
											className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-sm"
										/>
										<div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-love rounded-full flex items-center justify-center">
											<Heart className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
										</div>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1 sm:mb-2">
											<h3 className="font-bold text-foreground text-sm sm:text-base truncate">
												{match.user.name}, {match.user.age}
											</h3>
											<div className="flex items-center gap-1 flex-shrink-0 ml-2">
												<Heart className="w-3 h-3 sm:w-4 sm:h-4 text-love" />
												<span className="font-bold text-love text-sm sm:text-base">
													{match.matchPercentage}%
												</span>
											</div>
										</div>

										<p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate">
											{match.user.university}
										</p>
									</div>

									<div className="text-center flex-shrink-0">
										{isSelected ? (
											<div className="text-primary font-medium text-xs sm:text-sm">
												<Zap className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
												Selected
											</div>
										) : (
											<Button
												variant="ghost"
												size="sm"
												className="text-match hover:text-match-light text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
											>
												<Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
												<span className="hidden sm:inline">View </span>Baby
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})
				) : (
					<div className="text-center py-8">
						<h3 className="text-lg font-semibold text-gray-600 mb-2">
							No Matches Found
						</h3>
						<p className="text-sm text-gray-500">
							We're still processing matches for you. Check back soon!
						</p>
					</div>
				)}
			</div>

			{universityMatch.length > 0 && (
				<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
					<p className="text-xs sm:text-sm text-blue-700 text-center leading-relaxed">
						💡 All matches are from your university. Click any profile to
						generate your future baby!
					</p>
				</div>
			)}
		</Card>
	);
};
