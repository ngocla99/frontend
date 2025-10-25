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
			console.log(`🔌 Supabase realtime disabled for ${table}`);
			return;
		}

		const channelName = `${table}-${event}-${Date.now()}`;
		console.log(`🔌 Subscribing to Supabase realtime: ${channelName}`);

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
					console.log(`📡 Realtime event received on ${table}:`, event);
					onDataRef.current(payload);
				},
			)
			.subscribe((status) => {
				console.log(`📊 Realtime subscription status for ${table}:`, status);
				setConnectionState(status);

				if (status === "SUBSCRIBED") {
					console.log(
						`✅ Successfully subscribed to ${table} realtime updates`,
					);
				} else if (status === "CHANNEL_ERROR") {
					console.error(`❌ Failed to subscribe to ${table} realtime`);
				} else if (status === "TIMED_OUT") {
					console.error(`⏱️ Subscription to ${table} timed out`);
				}
			});

		return () => {
			if (channelRef.current) {
				console.log(`🔌 Unsubscribing from ${table} realtime`);
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
