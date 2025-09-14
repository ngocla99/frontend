import { Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MatchCardProps {
	user1: {
		name: string;
		image: string;
	};
	user2: {
		name: string;
		image: string;
	};
	matchPercentage: number;
	timestamp: string;
	isNew?: boolean;
	onViewMatch?: () => void;
}

export const MatchCard = ({
	user1,
	user2,
	matchPercentage,
	timestamp,
	isNew,
	onViewMatch,
}: MatchCardProps) => {
	return (
		<Card className="p-4 bg-gradient-card gap-0 shadow-soft border-0 hover:shadow-match transition-all duration-300">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center justify-center gap-6">
					<div className="flex flex-col items-center gap-2">
						<div className="relative">
							<img
								src={user1.image}
								alt={user1.name}
								className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
							/>
							<div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
								<Heart className="w-3 h-3 text-white" />
							</div>
						</div>
						<span className="text-sm font-medium text-foreground">
							{user1.name}
						</span>
					</div>

					<div className="flex flex-col items-center gap-1">
						<Heart className="w-6 h-6 text-love animate-pulse-heart" />
						<span className="text-2xl font-bold text-love">
							{matchPercentage}%
						</span>
						<span className="text-xs text-muted-foreground">MATCH</span>
					</div>

					<div className="flex flex-col items-center gap-2">
						<div className="relative">
							<img
								src={user2.image}
								alt={user2.name}
								className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
							/>
							<div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
								<Heart className="w-3 h-3 text-white" />
							</div>
						</div>
						<span className="text-sm font-medium text-foreground">
							{user2.name}
						</span>
					</div>
				</div>

				{isNew && (
					<div className="bg-match text-white px-2 py-1 rounded-full text-xs font-medium">
						NEW MATCH
					</div>
				)}
			</div>

			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>⏰ {timestamp}</span>
				<Button
					variant="ghost"
					size="sm"
					className="flex items-center gap-1 text-match hover:text-match-light transition-colors h-auto p-1"
					onClick={() => onViewMatch?.()}
				>
					<Zap className="w-3 h-3" />
					Click to view
				</Button>
			</div>
		</Card>
	);
};
