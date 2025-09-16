import { Heart, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PotentialMatch {
	id: string;
	name: string;
	image: string;
	age: number;
	university: string;
	major?: string;
	interests?: string[];
}

interface PotentialMatchesProps {
	userGender: string;
	onSelectMatch: (match: PotentialMatch) => void;
	selectedMatch?: PotentialMatch;
}

export const PotentialMatches = ({
	userGender,
	onSelectMatch,
	selectedMatch,
}: PotentialMatchesProps) => {
	// Demo data - opposite gender matches
	const oppositeGender = userGender === "male" ? "female" : "male";

	const potentialMatches: PotentialMatch[] = [
		{
			id: "1",
			name: userGender === "male" ? "Emma" : "Jake",
			image:
				userGender === "male"
					? "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=400&h=400&fit=crop&crop=face"
					: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
			age: 22,
			university: "Stanford University",
			major: "Computer Science",
			interests: ["Photography", "Travel", "Coffee"],
		},
		{
			id: "2",
			name: userGender === "male" ? "Sophie" : "Alex",
			image:
				userGender === "male"
					? "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
					: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
			age: 21,
			university: "Stanford University",
			major: "Psychology",
			interests: ["Music", "Art", "Hiking"],
		},
		{
			id: "3",
			name: userGender === "male" ? "Maya" : "David",
			image:
				userGender === "male"
					? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face"
					: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
			age: 23,
			university: "Stanford University",
			major: "Biology",
			interests: ["Science", "Movies", "Cooking"],
		},
		{
			id: "4",
			name: userGender === "male" ? "Zoe" : "Ryan",
			image:
				userGender === "male"
					? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
					: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face",
			age: 20,
			university: "Stanford University",
			major: "Business",
			interests: ["Sports", "Reading", "Gaming"],
		},
	];

	const calculateMatchPercentage = (match: PotentialMatch): number => {
		// Simple algorithm - in real app this would use ML/AI
		const baseMatch = 60;
		const ageBonus = Math.max(0, 10 - Math.abs(22 - match.age)) * 2; // Assume user is 22
		const randomFactor = Math.floor(Math.random() * 20);
		return Math.min(99, baseMatch + ageBonus + randomFactor);
	};

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
				{potentialMatches.map((match) => {
					const matchPercentage = calculateMatchPercentage(match);
					const isSelected = selectedMatch?.id === match.id;

					return (
						<div
							key={match.id}
							className={`p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-match ${
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
						</div>
					);
				})}
			</div>

			<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
				<p className="text-xs sm:text-sm text-blue-700 text-center leading-relaxed">
					💡 All matches are from your university. Click any profile to generate
					your future baby!
				</p>
			</div>
		</Card>
	);
};
