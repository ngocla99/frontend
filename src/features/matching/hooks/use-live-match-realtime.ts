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
