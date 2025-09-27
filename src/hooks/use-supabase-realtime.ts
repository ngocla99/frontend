import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { transformSupabaseMatchToDisplayData } from "@/features/matching/utils/transform-api-data";
import { type SupabaseMatch, supabase } from "@/lib/supabase";

type UseSupabaseRealtimeOptions = {
	table: string;
	event: "INSERT" | "UPDATE" | "DELETE" | "*";
	filter?: string;
	onData: (payload: any) => void;
	enabled?: boolean;
};

export const useSupabaseRealtime = ({
	table,
	event,
	filter,
	onData,
	enabled = true,
}: UseSupabaseRealtimeOptions) => {
	const channelRef = useRef<RealtimeChannel | null>(null);

	useEffect(() => {
		if (!enabled) return;

		const channelName = `${table}-${event}-${Date.now()}`;

		channelRef.current = supabase
			.channel(channelName)
			.on(
				"postgres_changes",
				{
					event,
					schema: "public",
					table,
					...(filter && { filter }),
				},
				onData,
			)
			.subscribe();

		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [table, event, filter, onData, enabled]);

	return {
		isConnected: channelRef.current?.state === "joined",
	};
};

export const useMatchesRealtime = (userId?: string) => {
	const queryClient = useQueryClient();

	const handleMatchInsert = (payload: { new: SupabaseMatch }) => {
		const newMatch = payload.new;

		// Transform raw Supabase data to display format
		const transformedMatch = transformSupabaseMatchToDisplayData(newMatch);

		// Update infinite query cache - add to the transformed data
		queryClient.setQueryData(
			["matching", "top", "infinite"],
			(oldData: any) => {
				if (!oldData) {
					return [transformedMatch]; // Return flat array as expected by select function
				}

				// Check for duplicates in the flat array
				const exists = oldData.some((match: any) => match.id === newMatch.id);
				if (!exists) {
					return [transformedMatch, ...oldData];
				}
				return oldData;
			},
		);

		// Optionally invalidate to refresh with full data
		// queryClient.invalidateQueries({ queryKey: ["matching", "top"] });
	};

	return useSupabaseRealtime({
		table: "matches",
		event: "INSERT",
		onData: handleMatchInsert,
		enabled: !!userId,
	});
};
