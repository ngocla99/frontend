import { Heart, Zap, Clock, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
		<Card className="p-4 bg-gradient-card gap-0 shadow-soft border-0 hover:shadow-match transition-all duration-300">
			<div className="relative">
				{/* Header with status badges */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-2">
						{isNew && (
							<Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md animate-pulse text-xs px-2 py-1">
								<Sparkles className="w-3 h-3 mr-1" />
								NEW MATCH
							</Badge>
						)}
						{isViewed && (
							<Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 text-xs px-2 py-1">
								VIEWED
							</Badge>
						)}
					</div>
				</div>

				{/* Main content */}
				<div className="flex items-center justify-between mb-4">
					{/* User 1 */}
					<div className="flex flex-col items-center gap-2">
						<div className="relative group/avatar">
							<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-sm opacity-60 group-hover/avatar:opacity-80 transition-opacity duration-300" />
							<img
								src={user1.image}
								alt={user1.name}
								className="relative w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
							/>
							<div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-md animate-bounce">
								<Heart className="w-2.5 h-2.5 text-white fill-white" />
							</div>
						</div>
						<span className="text-sm font-semibold text-gray-800 group-hover:text-pink-600 transition-colors duration-300">
							{user1.name}
						</span>
					</div>

					{/* Match percentage */}
					<div className="flex flex-col items-center gap-1 px-3">
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-md opacity-30" />
							<Heart className="relative w-6 h-6 text-pink-500 animate-pulse" />
						</div>
						<div className="text-center">
							<span className={`text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent`}>
								{matchPercentage}%
							</span>
							<div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
								MATCH
							</div>
						</div>
					</div>

					{/* User 2 */}
					<div className="flex flex-col items-center gap-2">
						<div className="relative group/avatar">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm opacity-60 group-hover/avatar:opacity-80 transition-opacity duration-300" />
							<img
								src={user2.image}
								alt={user2.name}
								className="relative w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
							/>
							<div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md animate-bounce">
								<Heart className="w-2.5 h-2.5 text-white fill-white" />
							</div>
						</div>
						<span className="text-sm font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
							{user2.name}
						</span>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between pt-3 border-t border-gray-100">
					<div className="flex items-center gap-1.5 text-xs text-gray-500">
						<Clock className="w-3.5 h-3.5" />
						<span className="font-medium">{timestamp}</span>
					</div>
					
					<AuthGuard>
						<Button
							variant="ghost"
							size="sm"
							className="group/btn flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-full px-4 py-1.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs"
							onClick={() =>
								onOpen({
									user1: { name: user1.name, photo: user1.image },
									user2: { name: user2.name, photo: user2.image },
								})
							}
						>
							<Zap className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
							<span className="font-semibold">View Match</span>
						</Button>
					</AuthGuard>
				</div>
			</div>
		</Card>
	);
};
