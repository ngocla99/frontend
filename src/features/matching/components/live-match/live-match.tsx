import React from "react";
import { LiveMatches } from "@/features/matching/components/live-match/LiveMatches";
import { MatchCard } from "@/features/matching/components/live-match/match-card";
import user1Image from "@/old/assets/user1.jpg";
import user2Image from "@/old/assets/user2.jpg";
import user3Image from "@/old/assets/user3.jpg";
import user4Image from "@/old/assets/user4.jpg";

// Extended demo matches data for infinite scroll
const allMatches = [
	{
		user1: { name: "Sophie", image: user1Image },
		user2: { name: "Jordan", image: user2Image },
		matchPercentage: 88,
		timestamp: "just now",
		isNew: false,
	},
	{
		user1: { name: "Casey", image: user3Image },
		user2: { name: "Zoe", image: user4Image },
		matchPercentage: 81,
		timestamp: "just now",
		isNew: false,
	},
	{
		user1: { name: "Sam", image: user2Image },
		user2: { name: "Zoe", image: user3Image },
		matchPercentage: 69,
		timestamp: "1m ago",
		isNew: true,
	},
	{
		user1: { name: "Alex", image: user1Image },
		user2: { name: "Jamie", image: user4Image },
		matchPercentage: 92,
		timestamp: "2m ago",
		isNew: true,
	},
	{
		user1: { name: "Taylor", image: user3Image },
		user2: { name: "Morgan", image: user2Image },
		matchPercentage: 76,
		timestamp: "5m ago",
		isNew: false,
	},
	{
		user1: { name: "Riley", image: user4Image },
		user2: { name: "Avery", image: user1Image },
		matchPercentage: 84,
		timestamp: "8m ago",
		isNew: false,
	},
	{
		user1: { name: "Quinn", image: user2Image },
		user2: { name: "Blake", image: user3Image },
		matchPercentage: 73,
		timestamp: "12m ago",
		isNew: false,
	},
	{
		user1: { name: "Drew", image: user1Image },
		user2: { name: "Sage", image: user4Image },
		matchPercentage: 89,
		timestamp: "15m ago",
		isNew: false,
	},
];

export function LiveMatch() {
	const [displayedMatches, setDisplayedMatches] = React.useState(3);
	const matches = allMatches.slice(0, displayedMatches);

	// const handleViewMatch = (
	// 	user1: { name: string; image: string },
	// 	user2: { name: string; image: string },
	// ) => {
	// 	setViewModalData({ user1, user2 });
	// 	setViewModalOpen(true);
	// };

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-display font-light text-foreground mb-2">
					Live University Matches
				</h2>
				<p className="text-muted-foreground mb-6">Real matches happening now</p>
				<LiveMatches activeUsers={345} newMatches={10} viewedMatches={14} />
			</div>

			<div className="h-[600px] overflow-y-auto space-y-4 pr-2">
				{matches.map((match, index) => (
					<MatchCard
						key={index}
						user1={match.user1}
						user2={match.user2}
						matchPercentage={match.matchPercentage}
						timestamp={match.timestamp}
						isNew={match.isNew}
						// onViewMatch={() => handleViewMatch(match.user1, match.user2)}
						onViewMatch={() => {}}
					/>
				))}
			</div>
		</div>
	);
}
