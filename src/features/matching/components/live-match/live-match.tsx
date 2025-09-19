import { motion } from "framer-motion";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveMatchInfinite } from "@/features/matching/api/get-live-match";
import { HeadCard } from "@/features/matching/components/live-match/head-card";
import { MatchCard } from "@/features/matching/components/live-match/match-card";

export function LiveMatch() {
	const [activeFilter, setActiveFilter] = React.useState<
		"all" | "new" | "viewed"
	>("all");

	const { data: liveMatchData, isLoading, error } = useLiveMatchInfinite();
	const allMatches = liveMatchData || [];

	const matches = React.useMemo(() => {
		switch (activeFilter) {
			case "new":
				return allMatches.filter((match) => match.isNew === true);
			case "viewed":
				return allMatches.filter((match) => match.isViewed === true);
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
			activeUsers: allMatches.length, // Use actual match count as active users indicator
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
					Real matches happening now
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
						{isLoading ? (
							<div className="text-center py-8 text-muted-foreground">
								<p>Loading matches...</p>
							</div>
						) : error ? (
							<div className="text-center py-8 text-destructive">
								<p>Failed to load matches. Please try again.</p>
							</div>
						) : matches.length > 0 ? (
							matches.map((match, index) => {
								const matchId = `${match.user1.name}-${match.user2.name}-${index}`;

								return <MatchCard key={matchId} data={match} />;
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
