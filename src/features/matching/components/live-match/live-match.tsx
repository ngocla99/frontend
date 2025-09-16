import React from "react";
import { useMe } from "@/features/auth/api/get-me";
import { HeadCard } from "@/features/matching/components/live-match/head-card";
import { MatchCard } from "@/features/matching/components/live-match/match-card";
import { DUMMY_MATCHES } from "@/features/matching/constants/data";
import { useLiveMatches } from "@/features/matching/hooks/use-live-matches";
import { useUserLiveMatches } from "@/features/matching/hooks/use-user-live-matches";

export function LiveMatch() {
	const { data: user } = useMe();

	// Use socket hooks for real-time matches
	const { matches: liveMatches } = useLiveMatches();
	const { matches: userMatches } = useUserLiveMatches(user?.user_id);

	const [displayedMatches] = React.useState(3);
	const [activeFilter, setActiveFilter] = React.useState<
		"all" | "new" | "viewed"
	>("all");

	// Combine demo matches with real-time matches
	const allRealMatches = [...liveMatches, ...userMatches];
	const allMatches = allRealMatches.length > 0 ? allRealMatches : DUMMY_MATCHES;

	// Filter matches based on active filter
	const filteredMatches = React.useMemo(() => {
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

	// Get the displayed matches based on filter
	const matches = filteredMatches.slice(0, displayedMatches);

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
				<p className="text-muted-foreground mb-6">Real matches happening now</p>
				<HeadCard
					stats={stats}
					onFilterChange={setActiveFilter}
					activeFilter={activeFilter}
				/>
			</div>

			<div className="h-[600px] overflow-y-auto space-y-4 pr-2">
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
		</div>
	);
}
