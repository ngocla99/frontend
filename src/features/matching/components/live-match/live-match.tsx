import { motion } from "framer-motion";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveMatchInfinite } from "@/features/matching/api/get-live-match";
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

	// State to track newly added matches for animation
	const [newlyAddedMatches, setNewlyAddedMatches] = React.useState<Set<string>>(
		new Set(),
	);

	// const { data: matchesData, isLoading } = useLiveMatch();
	const { data: matchesDataInfinite } = useLiveMatchInfinite();
	console.log(
		"🚀 ~ file: live-match.tsx:23 ~ matchesDataInfinite:",
		matchesDataInfinite,
	);

	// Effect to generate new dummy matches every 3 seconds
	React.useEffect(() => {
		if (!isDummyMode) return;

		const interval = setInterval(() => {
			setDummyMatches((prevMatches) => {
				const newMatch = generateRandomDummyMatch();
				const matchId = `${newMatch.user1.name}-${newMatch.user2.name}-${Date.now()}`;

				// Track this as a newly added match for animation
				setNewlyAddedMatches((prev) => new Set([...prev, matchId]));

				// Remove from newly added after animation completes
				setTimeout(() => {
					setNewlyAddedMatches((prev) => {
						const newSet = new Set(prev);
						newSet.delete(matchId);
						return newSet;
					});
				}, 300); // Animation duration

				// Add new match at the beginning - no limit for infinite scrolling
				return [{ ...newMatch, id: matchId }, ...prevMatches];
			});
		}, 3000); // Every 3 seconds

		return () => clearInterval(interval);
	}, [isDummyMode]);

	// Combine demo matches with real-time matches
	const allRealMatches: typeof DUMMY_MATCHES = [];
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
			<motion.div
				className="text-center"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
			>
				<motion.h2
					className="text-2xl font-display font-light text-foreground mb-2"
					animate={{
						backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: "linear",
					}}
					style={{
						background: "linear-gradient(90deg, #ec4899, #f43f5e, #ec4899)",
						backgroundSize: "200% 100%",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
					}}
				>
					Live University Matches
				</motion.h2>
				<motion.p
					className="text-muted-foreground mb-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3, duration: 0.4 }}
				>
					{isDummyMode
						? "Demo matches (new match every 3 seconds)"
						: "Real matches happening now"}
				</motion.p>

				<HeadCard
					stats={stats}
					onFilterChange={setActiveFilter}
					activeFilter={activeFilter}
				/>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					delay: 0.4,
					duration: 0.5,
					ease: [0.25, 0.46, 0.45, 0.94],
				}}
			>
				<ScrollArea className="h-[600px]">
					<div className="space-y-4">
						{matches.length > 0 ? (
							matches.map((match, index) => {
								const matchId =
									(match as { id?: string }).id ||
									`${match.user1.name}-${match.user2.name}-${index}`;
								const isNewlyAdded = newlyAddedMatches.has(matchId);

								return (
									<MatchCard
										key={matchId}
										data={match}
										isNewlyAdded={isNewlyAdded}
									/>
								);
							})
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No matches found for the selected filter.</p>
							</div>
						)}
					</div>
				</ScrollArea>
			</motion.div>
		</div>
	);
}
