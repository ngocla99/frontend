import { Heart, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";
import { useUserUpload } from "@/features/matching/store/user-upload";

interface BackendMatch {
	task_id: string;
	source_user_id: string;
	source_face_id: string;
	target_user_id: string;
	target_face_id: string;
	similarity: number;
	target_image_url: string | null;
}

interface UniversityMatch {
	id: string;
	name: string;
	image: string;
	age: number;
	university: string;
	major?: string;
	interests?: string[];
	similarity?: number;
	target_user_id?: string;
	target_face_id?: string;
}

interface UniversityMatchProps {
	userGender: string;
	onSelectMatch: (match: UniversityMatch) => void;
	selectedMatch?: UniversityMatch;
}

export const UniversityMatchTab = ({
	userGender,
	onSelectMatch,
	selectedMatch,
}: UniversityMatchProps) => {
	const userUpload = useUserUpload();
	const { matches: userMatches } = useUserLiveMatches(userUpload?.user_id);
	console.log("🚀 ~ UniversityMatchTab ~ userMatches:", userMatches);

	// Extract name from email address
	const extractNameFromEmail = (email: string): string => {
		return email.split("@")[0];
	};

	// Transform backend match data to UniversityMatch format
	const transformMatches = (matches: BackendMatch[]): UniversityMatch[] => {
		return matches.map((match, index) => ({
			id: match.target_face_id || `match-${index}`,
			name: extractNameFromEmail(match.target_user_id),
			image:
				match.target_image_url ||
				(userGender === "male"
					? "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=400&h=400&fit=crop&crop=face"
					: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"),
			age: 22 + (index % 3), // Vary age between 22-24
			university: "Stanford University",
			major: ["Computer Science", "Psychology", "Biology", "Business"][
				index % 4
			],
			interests: [
				["Photography", "Travel", "Coffee"],
				["Music", "Art", "Hiking"],
				["Science", "Movies", "Cooking"],
				["Sports", "Reading", "Gaming"],
			][index % 4],
			similarity: match.similarity,
			target_user_id: match.target_user_id,
			target_face_id: match.target_face_id,
		}));
	};

	// Transform real matches if available, otherwise return empty array
	const universityMatch: UniversityMatch[] =
		userMatches && userMatches.length > 0
			? transformMatches(userMatches as BackendMatch[])
			: [];

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
						const matchPercentage = match.similarity
							? Math.round(match.similarity)
							: 0;
						const isSelected = selectedMatch?.id === match.id;

						return (
							<button
								key={match.id}
								type="button"
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
											src={match.image}
											alt={match.name}
											className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-sm"
										/>
										<div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-love rounded-full flex items-center justify-center">
											<Heart className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
										</div>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1 sm:mb-2">
											<h3 className="font-bold text-foreground text-sm sm:text-base truncate">
												{match.name}, {match.age}
											</h3>
											<div className="flex items-center gap-1 flex-shrink-0 ml-2">
												<Heart className="w-3 h-3 sm:w-4 sm:h-4 text-love" />
												<span className="font-bold text-love text-sm sm:text-base">
													{matchPercentage}%
												</span>
											</div>
										</div>

										<p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 truncate">
											{match.major} • {match.university}
										</p>

										<div className="flex gap-1 mb-2 sm:mb-3 flex-wrap">
											{match.interests?.slice(0, 2).map((interest, idx) => (
												<Badge
													key={idx}
													variant="secondary"
													className="text-xs px-2 py-0.5"
												>
													{interest}
												</Badge>
											))}
											{match.interests && match.interests.length > 2 && (
												<Badge
													variant="secondary"
													className="text-xs px-2 py-0.5"
												>
													+{match.interests.length - 2}
												</Badge>
											)}
										</div>
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
							</button>
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
