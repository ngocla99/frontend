import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

/**
 * API function to mark a match as viewed
 */
export const markMatchViewedApi = (matchId: string) => {
	return api.post(`/matches/${matchId}/view`);
};

/**
 * React Query hook to mark a match as viewed with optimistic updates
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
			// Cancel any outgoing refetches to avoid overwriting our optimistic update
			await queryClient.cancelQueries({
				queryKey: ["matching", "top"],
			});

			// Snapshot the previous value for rollback
			const previousData = queryClient.getQueryData(["matching", "top"]);

			// Optimistically update the cache
			queryClient.setQueriesData(
				{ queryKey: ["matching", "top", "infinite"] },
				(old: unknown) => {
					if (!old || typeof old !== "object" || !("pages" in old)) return old;

					const oldData = old as {
						pages: Array<{ matches: Array<{ id: string; my_reaction: string[] }> }>;
						pageParams: unknown[];
					};

					return {
						...oldData,
						pages: oldData.pages.map((page) => ({
							...page,
							matches: page.matches.map((match) =>
								match.id === matchId
									? {
											...match,
											my_reaction: match.my_reaction?.includes("viewed")
												? match.my_reaction
												: [...(match.my_reaction || []), "viewed"],
										}
									: match,
							),
						})),
					};
				},
			);

			return { previousData } as { previousData: unknown };
		},
		onError: (_err, _matchId, context) => {
			// Rollback on error
			const ctx = context as { previousData: unknown } | undefined;
			if (ctx?.previousData) {
				queryClient.setQueryData(["matching", "top"], ctx.previousData);
			}
		},
		onSettled: () => {
			// Always refetch after mutation settles to ensure consistency
			queryClient.invalidateQueries({
				queryKey: ["matching", "top"],
			});
		},
		...config,
	});
};
