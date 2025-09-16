import { Heart, Zap } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserMatchesActions } from "../../store/user-matches";

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
	isViewed?: boolean;
}

export const MatchCard = ({
	user1,
	user2,
	matchPercentage,
	timestamp,
	isNew,
	isViewed,
}: MatchCardProps) => {
	const { onOpen } = useUserMatchesActions();
	return (
		<Card
			className={`p-4 bg-gradient-card gap-0 shadow-soft border-0 hover:shadow-match transition-all duration-300`}
		>
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

				<div className="flex gap-2">
					{isNew && (
						<div className="bg-match text-white px-2 py-1 rounded-full text-xs font-medium">
							NEW MATCH
						</div>
					)}
					{isViewed && (
						<div className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
							VIEWED
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>⏰ {timestamp}</span>
				<AuthGuard>
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-1 text-match rounded-full transition-colors h-auto p-1"
						onClick={() =>
							onOpen({
								user1: { name: user1.name, photo: user1.image },
								user2: { name: user2.name, photo: user2.image },
							})
						}
					>
						<Zap className="w-3 h-3" />
						Click to view
					</Button>
				</AuthGuard>
			</div>
		</Card>
	);
};
