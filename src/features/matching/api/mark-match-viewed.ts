import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { MatchStats } from "./get-match-stats";

/**
 * API function to mark a match as viewed
 */
export const markMatchViewedApi = (matchId: string) => {
	return api.post(`/matches/${matchId}/view`);
};

/**
 * React Query hook to mark a match as viewed with optimistic updates
 *
 * Optimistically updates both:
 * 1. Match data - adds "viewed" to my_reaction array
 * 2. Stats data - increments viewed count
 *
 * Usage:
 * ```tsx
 * const { mutate: markViewed } = useMarkMatchViewed();
 * markViewed(matchId);
 * ```
 */
export const useMarkMatchViewed = (
	config?: MutationConfig<typeof markMatchViewedApi>,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: markMatchViewedApi,
		onMutate: async (matchId: string) => {
			// Cancel any outgoing refetches to avoid overwriting our optimistic updates
			await queryClient.cancelQueries({
				queryKey: ["matching", "top", "infinite"],
			});
			await queryClient.cancelQueries({
				queryKey: ["matching", "stats"],
			});

			// Snapshot the previous values for rollback
			const previousMatchData = queryClient.getQueryData([
				"matching",
				"top",
				"infinite",
			]) as {
				pages: Array<Array<{ id: string; my_reaction: string[] }>>;
				pageParams: unknown[];
			};

			const previousStatsData = queryClient.getQueryData(["matching", "stats"]);

			// Optimistically update match data cache (add "viewed" to my_reaction)
			queryClient.setQueriesData(
				{ queryKey: ["matching", "top", "infinite"] },
				(old: unknown) => {
					if (!old || typeof old !== "object" || !("pages" in old)) return old;

					const oldData = old as {
						pages: Array<Array<{ id: string; my_reaction: string[] }>>;
						pageParams: unknown[];
					};

					return {
						...oldData,
						pages: oldData.pages.map((page) =>
							page.map((match) =>
								match.id === matchId
									? {
											...match,
											my_reaction: match.my_reaction?.includes("viewed")
												? match.my_reaction
												: [...(match.my_reaction || []), "viewed"],
										}
									: match,
							),
						),
					};
				},
			);

			// Optimistically update stats cache (increment viewed count)
			queryClient.setQueryData<MatchStats>(
				["matching", "stats"],
				(old: MatchStats | undefined) => {
					if (!old) return old;

					const match = previousMatchData?.pages
						?.flat()
						.find((m) => m.id === matchId);
					const alreadyViewed = match?.my_reaction?.includes("viewed");

					return {
						...old,
						viewed: alreadyViewed ? old.viewed : (old.viewed ?? 0) + 1,
					};
				},
			);

			return { previousMatchData, previousStatsData };
		},
		onError: (_err, _matchId, context) => {
			// Rollback on error
			const ctx = context as
				| { previousMatchData: unknown; previousStatsData: unknown }
				| undefined;
			if (ctx?.previousMatchData) {
				queryClient.setQueryData(
					["matching", "top", "infinite"],
					ctx.previousMatchData,
				);
			}
			if (ctx?.previousStatsData) {
				queryClient.setQueryData(["matching", "stats"], ctx.previousStatsData);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["matching", "stats"],
			});
		},
		...config,
	});
};
