import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

export type ReactToMatchInput = {
	matchId: string;
	favorite: boolean;
};

export const reactToMatchApi = (input: ReactToMatchInput) => {
	if (input.favorite) {
		// POST to add favorite reaction
		return apiClient.post(`/api/v1/matches/${input.matchId}/react`, null, {
			params: { type: "favorite" },
		});
	} else {
		// DELETE to remove reaction
		return apiClient.delete(`/api/v1/matches/${input.matchId}/react`);
	}
};

export const useReactToMatch = (
	config?: MutationConfig<typeof reactToMatchApi>,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: reactToMatchApi,
		onMutate: async ({ matchId, favorite }) => {
			// Cancel any outgoing refetches to avoid overwriting our optimistic update
			await queryClient.cancelQueries({ queryKey: ["matching"] });

			// Optimistically update user matches (flat array)
			queryClient.setQueriesData(
				{ queryKey: ["matching", "user"] },
				(old: unknown) => {
					if (!Array.isArray(old)) return old;
					return old.map((m: Record<string, unknown>) =>
						m?.id === matchId ? { ...m, isFavorited: favorite } : m,
					);
				},
			);

			// Optimistically update live matches infinite cache if present
			queryClient.setQueriesData(
				{ queryKey: ["matching", "top", "infinite"] },
				(old: unknown) => {
					if (!old || typeof old !== "object" || !("pages" in old)) return old;
					const oldData = old as { pages: Record<string, unknown>[][] };
					return {
						...oldData,
						pages: oldData.pages.map((page: Record<string, unknown>[]) =>
							page.map((m: Record<string, unknown>) =>
								m?.id === matchId ? { ...m, isFavorited: favorite } : m,
							),
						),
					};
				},
			);
		},
		onSettled: () => {
			// Always refetch after mutation settles to ensure consistency
			queryClient.invalidateQueries({ queryKey: ["matching"] });
		},
		...config,
	});
};
