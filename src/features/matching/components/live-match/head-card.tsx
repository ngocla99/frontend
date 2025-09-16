import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface HeadCardProps {
	stats: {
		activeUsers: number;
		newMatches: number;
		viewedMatches: number;
	};
}

export const HeadCard = ({ stats }: HeadCardProps) => {
	const { activeUsers, newMatches, viewedMatches } = stats;
	return (
		<Card className="p-4 bg-gradient-primary text-white border-0 shadow-match gap-0 rounded-2xl">
			<div className="flex items-center gap-2 mb-2">
				<Flame className="w-5 h-5" />
				<h3 className="font-semibold">Live Matches</h3>
			</div>

			<p className="text-sm text-white/90 mb-3">
				🔥 {activeUsers} people getting matched right now
			</p>

			<div className="flex gap-2">
				<Badge
					variant="secondary"
					className="bg-white/20 text-white border-0 rounded-full cursor-pointer"
				>
					😍 New ({newMatches})
				</Badge>
				<Badge
					variant="outline"
					className="bg-transparent text-white border-white/30 rounded-full cursor-pointer"
				>
					👀 Viewed ({viewedMatches})
				</Badge>
			</div>
		</Card>
	);
};
