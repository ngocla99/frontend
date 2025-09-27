import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { SupabaseMatch } from "@/lib/supabase";

/**
 * Hook for handling live match realtime updates
 * This approach simply invalidates queries when new matches are detected,
 * letting the existing API fetch the complete data with user information
 */
export const useLiveMatchRealtime = (userId?: string) => {
	const queryClient = useQueryClient();

	const handleMatchInsert = (payload: { new: SupabaseMatch }) => {
		console.log("🔥 New match detected via Supabase realtime:", payload.new);

		// Option 1: Simply invalidate to trigger refetch with complete data
		queryClient.invalidateQueries({
			queryKey: ["matching", "top", "infinite"],
		});

		// Option 2: Show a notification (if you have a notification system)
		// showNotification({
		//   title: "New Match Found!",
		//   message: `${Math.round(payload.new.similarity_score)}% similarity`,
		//   type: "success"
		// });
	};

	return useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: !!userId,
	});
};

/**
 * Alternative approach: Optimistic updates with partial data
 * This adds a placeholder match immediately, then replaces it with full data
 */
export const useLiveMatchRealtimeOptimistic = (userId?: string) => {
	const queryClient = useQueryClient();

	const handleMatchInsert = (payload: { new: SupabaseMatch }) => {
		const newMatch = payload.new;

		// Add optimistic placeholder
		queryClient.setQueryData(
			["matching", "top", "infinite"],
			(oldData: any) => {
				if (!oldData) return [];

				const placeholderMatch = {
					id: newMatch.id,
					user1: { name: "Loading...", image: "/placeholder-avatar.png" },
					user2: { name: "Loading...", image: "/placeholder-avatar.png" },
					matchPercentage: Math.round(newMatch.similarity_score),
					timestamp: "just now",
					isNew: true,
					isViewed: false,
					isFavorited: false,
					_isPlaceholder: true, // Flag to identify placeholder
				};

				return [placeholderMatch, ...oldData];
			},
		);

		// Trigger refetch to get complete data
		setTimeout(() => {
			queryClient.invalidateQueries({
				queryKey: ["matching", "top", "infinite"],
			});
		}, 100);
	};

	return useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: !!userId,
	});
};
