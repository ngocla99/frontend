import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

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
				"postgres_changes" as any,
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
