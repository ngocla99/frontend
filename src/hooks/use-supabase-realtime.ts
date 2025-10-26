/** biome-ignore-all lint/suspicious/noExplicitAny: <no need check> */
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
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
	const [connectionState, setConnectionState] = useState<string>("idle");
	const onDataRef = useRef(onData);

	// Keep the onData callback up to date without re-subscribing
	useEffect(() => {
		onDataRef.current = onData;
	}, [onData]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		// Use stable channel name without timestamp to prevent re-subscriptions
		const filterSuffix = filter ? `-${filter.replace(/=/g, "-")}` : "";
		const channelName = `${table}-${event}${filterSuffix}`;

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
				(payload) => {
					onDataRef.current(payload);
				},
			)
			.subscribe((status) => {
				setConnectionState(status);

				// Only log errors in production, success in dev
				if (status === "CHANNEL_ERROR") {
					console.error(`❌ Realtime connection failed for ${table}`);
				} else if (status === "TIMED_OUT") {
					console.error(`⏱️ Realtime subscription timeout for ${table}`);
				}
			});

		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
				setConnectionState("idle");
			}
		};
	}, [table, event, filter, enabled]); // Removed onData from dependencies

	return {
		isConnected: channelRef.current?.state === "joined",
		connectionState,
	};
};
