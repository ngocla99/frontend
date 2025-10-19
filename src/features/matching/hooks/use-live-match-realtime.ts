import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { SupabaseMatch } from "@/lib/supabase";

/**
 * Hook for handling live match realtime updates
 * Subscribes to ALL new matches in the system (public feed behavior)
 * When a new match is detected, invalidates queries to trigger refetch
 */
export const useLiveMatchRealtime = () => {
	const queryClient = useQueryClient();

	const handleMatchInsert = useCallback(
		(payload: { new: SupabaseMatch }) => {
			console.log("🔥 New match detected via Supabase realtime:", payload.new);
			// Invalidate to trigger refetch with complete data (including user info)
			queryClient.invalidateQueries({
				queryKey: ["matching", "top", "infinite"],
			});

			console.log("✅ Live match query invalidated - UI will update");

			// Optional: Show a notification (if you have a notification system)
			// showNotification({
			//   title: "New Match Found!",
			//   message: `${Math.round(payload.new.similarity_score)}% similarity`,
			//   type: "success"
			// });
		},
		[queryClient],
	);

	return useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: true, // Always enabled for live match feed
	});
};
