import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { SupabaseMatch } from "@/lib/supabase";
import type { UserMatchApi } from "@/types/api";
import { getUserMatchQueryOptions, useUserMatch } from "../api/get-user-match";

export const useUserLiveMatches = (userId?: string) => {
	const queryClient = useQueryClient();
	const { data: userMatches, isLoading, error } = useUserMatch();

	// Listen for real-time match events for this user via Supabase
	const handleMatchInsert = (payload: { new: SupabaseMatch }) => {
		console.log("🔥 New user match detected:", payload.new);

		// Invalidate user matches to trigger refetch with complete data
		queryClient.invalidateQueries({
			queryKey: getUserMatchQueryOptions().queryKey,
		});
	};

	useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: !!userId,
	});

	return {
		matches: userMatches || [],
		isLoading: isLoading,
		error: error,
	};
};
