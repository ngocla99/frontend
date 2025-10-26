import { motion } from "framer-motion";
import React from "react";
import { useInView } from "react-intersection-observer";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveMatchInfinite } from "@/features/matching/api/get-live-match";
import { HeadCard } from "@/features/matching/components/live-match/head-card";
import { MatchCard } from "@/features/matching/components/live-match/match-card";

const MatchCardSkeleton = () => (
	<Card className="py-6 px-6 bg-gradient-card gap-0 shadow-soft border-0">
		<div className="flex items-center justify-between mb-4">
			{/* User 1 */}
			<div className="flex flex-col items-center gap-2">
				<Skeleton className="w-14 h-14 rounded-full" />
				<Skeleton className="h-3 w-12" />
			</div>

			{/* Match percentage */}
			<div className="flex flex-col items-center gap-1 px-3">
				<Skeleton className="w-6 h-6 rounded-full" />
				<div className="text-center">
					<Skeleton className="h-8 w-12 mb-1" />
					<Skeleton className="h-3 w-10" />
				</div>
				{/* Status badges area */}
				<div className="flex items-center justify-center gap-2 mt-4">
					<Skeleton className="h-6 w-12 rounded-full" />
				</div>
			</div>

			{/* User 2 */}
			<div className="flex flex-col items-center gap-2">
				<Skeleton className="w-14 h-14 rounded-full" />
				<Skeleton className="h-3 w-12" />
			</div>
		</div>

		{/* Footer */}
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-1.5">
				<Skeleton className="w-3.5 h-3.5 rounded-full" />
				<Skeleton className="h-3 w-16" />
			</div>
			<Skeleton className="h-7 w-20 rounded-full" />
		</div>
	</Card>
);

export function LiveMatch() {
	const [activeFilter, setActiveFilter] = React.useState<
		"all" | "new" | "viewed"
	>("all");
	const { ref, inView } = useInView();

	// Note: Realtime subscription is now at RootLayout level to persist across page interactions

	const {
		data: liveMatchData,
		isLoading,
		isFetchingNextPage: isFetchingNextPageInfinite,
		fetchNextPage,
		error,
	} = useLiveMatchInfinite();
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

	React.useEffect(() => {
		if (inView) {
			fetchNextPage();
		}
	}, [fetchNextPage, inView]);

	return (
		<div className="space-y-6">
			<motion.div
				className="text-center m-0 mb-4 sm:mx-4"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
			>
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
				<ScrollArea className="sm:h-[716px]">
					<div className="space-y-4 p-0 sm:p-4">
						{isLoading ? (
							// Show skeleton cards while loading
							Array.from({ length: 4 }).map((_, index) => (
								<MatchCardSkeleton key={index} />
							))
						) : error ? (
							<div className="text-center py-8 text-destructive">
								<p>Failed to load matches. Please try again.</p>
							</div>
						) : matches.length > 0 ? (
							<>
								{matches.map((match, index) => {
									return <MatchCard key={match.id + index} data={match} />;
								})}
								<div ref={ref} />
							</>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<p>No matches found for the selected filter.</p>
							</div>
						)}
						{isFetchingNextPageInfinite &&
							Array.from({ length: 2 }).map((_, index) => (
								<MatchCardSkeleton key={index} />
							))}
					</div>
				</ScrollArea>
			</motion.div>
		</div>
	);
}
