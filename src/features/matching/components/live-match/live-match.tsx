import React from "react";
import { useMe } from "@/features/auth/api/get-me";
import { useLiveMatch } from "@/features/matching/api/get-live-match";
import user1Image from "@/features/matching/assets/user1.jpg";
import user2Image from "@/features/matching/assets/user2.jpg";
import user3Image from "@/features/matching/assets/user3.jpg";
import user4Image from "@/features/matching/assets/user4.jpg";
import { HeadCard } from "@/features/matching/components/live-match/head-card";
import { MatchCard } from "@/features/matching/components/live-match/match-card";
import { useLiveMatches } from "@/features/matching/hooks/use-live-matches";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";

const DUMMY_MATCHES = [
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

const DUMMY_STATS = {
	activeUsers: 345,
	newMatches: 10,
	viewedMatches: 14,
};

export function LiveMatch() {
	const { data: user } = useMe();
	const { data: liveMatch } = useLiveMatch();

	// Use socket hooks for real-time matches
	const { matches: liveMatches } = useLiveMatches();
	const { matches: userMatches } = useUserLiveMatches(user?.user_id);

	const [displayedMatches] = React.useState(3);

	// Combine demo matches with real-time matches
	const allRealMatches = [...liveMatches, ...userMatches];
	const matches =
		allRealMatches.length > 0
			? allRealMatches.slice(0, displayedMatches)
			: DUMMY_MATCHES.slice(0, displayedMatches);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-display font-light text-foreground mb-2">
					Live University Matches
				</h2>
				<p className="text-muted-foreground mb-6">Real matches happening now</p>
				<HeadCard stats={DUMMY_STATS} />
			</div>

			<div className="h-[600px] overflow-y-auto space-y-4 pr-2">
				{matches.map((match, index) => (
					<MatchCard
						key={match.user1.name + match.user2.name + index}
						user1={match.user1}
						user2={match.user2}
						matchPercentage={match.matchPercentage}
						timestamp={match.timestamp}
						isNew={match.isNew}
					/>
				))}
			</div>
		</div>
	);
}
