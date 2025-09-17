import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeadCard } from "@/features/matching/components/live-match/head-card";
import { MatchCard } from "@/features/matching/components/live-match/match-card";
import {
	DUMMY_MATCHES,
	generateRandomDummyMatch,
} from "@/features/matching/constants/data";

export function LiveMatch() {
	const [activeFilter, setActiveFilter] = React.useState<
		"all" | "new" | "viewed"
	>("all");

	// State for dummy matches with real-time updates
	const [dummyMatches, setDummyMatches] = React.useState(DUMMY_MATCHES);
	const [isDummyMode] = React.useState(true);

	// Effect to generate new dummy matches every 3 seconds
	React.useEffect(() => {
		if (!isDummyMode) return;

		const interval = setInterval(() => {
			setDummyMatches((prevMatches) => {
				const newMatch = generateRandomDummyMatch();
				// Add new match at the beginning - no limit for infinite scrolling
				return [newMatch, ...prevMatches];
			});
		}, 3000); // Every 3 seconds

		return () => clearInterval(interval);
	}, [isDummyMode]);

	// Combine demo matches with real-time matches
	const allRealMatches = [];
	const allMatches = isDummyMode
		? dummyMatches
		: allRealMatches.length > 0
			? allRealMatches
			: DUMMY_MATCHES;

	const matches = React.useMemo(() => {
		switch (activeFilter) {
			case "new":
				return allMatches.filter((match) => match.isNew === true);
			case "viewed":
				return allMatches.filter((match) => match.isViewed === true);
			case "all":
			default:
				return allMatches;
		}
	}, [allMatches, activeFilter]);

	// Calculate stats based on current data
	const stats = React.useMemo(() => {
		const newCount = allMatches.filter((match) => match.isNew === true).length;
		const viewedCount = allMatches.filter(
			(match) => match.isViewed === true,
		).length;

		return {
			activeUsers: 345,
			newMatches: newCount,
			viewedMatches: viewedCount,
		};
	}, [allMatches]);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-display font-light text-foreground mb-2">
					Live University Matches
				</h2>
				<p className="text-muted-foreground mb-4">
					{isDummyMode
						? "Demo matches (new match every 3 seconds)"
						: "Real matches happening now"}
				</p>

				<HeadCard
					stats={stats}
					onFilterChange={setActiveFilter}
					activeFilter={activeFilter}
				/>
			</div>

			<ScrollArea className="h-[600px]">
				<div className="space-y-4">
					{matches.length > 0 ? (
						matches.map((match, index) => (
							<MatchCard
								key={match.user1.name + match.user2.name + index}
								user1={match.user1}
								user2={match.user2}
								matchPercentage={match.matchPercentage}
								timestamp={match.timestamp}
								isNew={match.isNew}
								isViewed={match.isViewed}
							/>
						))
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<p>No matches found for the selected filter.</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
