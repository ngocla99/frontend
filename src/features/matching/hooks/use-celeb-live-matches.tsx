import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import type { SupabaseMatch } from "@/lib/supabase";
import {
	getCelebMatchQueryOptions,
	useCelebMatch,
} from "../api/get-celeb-match";

export const useCelebLiveMatches = (
	userId?: string,
	faceId?: string | null,
) => {
	const queryClient = useQueryClient();
	const {
		data: celebMatches,
		isLoading,
		error,
	} = useCelebMatch({
		input: faceId ? { face_id: faceId, limit: 50, offset: 0 } : undefined,
		queryConfig: {
			enabled: !!faceId,
		},
	});

	// Listen for real-time match events for this user via Supabase
	const handleMatchInsert = (_payload: { new: SupabaseMatch }) => {
		// Invalidate celeb matches to trigger refetch with complete data
		queryClient.invalidateQueries({
			queryKey: getCelebMatchQueryOptions().queryKey,
		});
	};

	useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: !!userId,
	});

	return {
		matches: celebMatches || [],
		isLoading: isLoading,
		error: error,
	};
};
