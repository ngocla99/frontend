import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { SupabaseMatch } from "@/types/api";

/**
 * Hook for handling live match realtime updates
 * Subscribes to ALL new matches in the system
 * When a new match is detected, invalidates all match queries to trigger refetch
 */
export const useMatchRealtime = () => {
	const queryClient = useQueryClient();

	const handleMatchInsert = useCallback(
		(payload: { new: SupabaseMatch }) => {
			// Invalidate all match-related queries to trigger refetch
			// This covers: live matches, user matches, celeb matches
			queryClient.invalidateQueries({
				queryKey: ["matching"],
			});
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
