import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { useUser } from "@/features/auth/api/get-me";
import { createClient } from "@/lib/supabase/client";
import { useUpdateLastSeen } from "../api/update-last-seen";
import { usePresenceActions } from "../store/presence-store";
import type { PresenceState } from "../types/index";

/**
 * Hook to track the current user's online presence
 * Joins the presence channel and tracks when user is online
 * Updates last_seen timestamp on disconnect
 * Updates global presence store with online/offline status
 *
 * Usage: Call this hook once at the root level (e.g., in layout or app provider)
 */
export function usePresenceTracker() {
	const user = useUser();
	const updateLastSeen = useUpdateLastSeen();
	const presenceActions = usePresenceActions();
	const channelRef = useRef<RealtimeChannel | null>(null);

	useEffect(() => {
		if (!user?.id) return;

		const supabase = createClient();

		// Subscribe to presence channel
		const subscribeToPresence = async () => {
			channelRef.current = supabase.channel("connections:presence");

			channelRef.current
				.on("presence", { event: "sync" }, () => {
					// Presence state synced - update global store
					const state = channelRef.current?.presenceState() as PresenceState;
					presenceActions.setPresenceState(state);
					console.log(
						"[Presence Tracker] ✅ Presence synced. Current state:",
						state,
					);
				})
				.on("presence", { event: "join" }, ({ key, newPresences }) => {
					console.log("[Presence Tracker] 👋 User joined:", key, newPresences);
					// Update store with new online user
					for (const presence of newPresences) {
						presenceActions.userJoined(presence.user_id);
					}
				})
				.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
					console.log("[Presence Tracker] 👋 User left:", key, leftPresences);
					// Update store with offline user
					for (const presence of leftPresences) {
						presenceActions.userLeft(presence.user_id);
					}
				})
				.subscribe(async (status) => {
					if (status === "CHANNEL_ERROR") {
						console.error(
							"[Presence Tracker] ❌ Error subscribing to presence",
						);
					}
					if (status === "TIMED_OUT") {
						console.error(
							"[Presence Tracker] ⏱️ Presence subscription timed out",
						);
					}
					if (status !== "SUBSCRIBED") {
						return;
					}
					// Track presence with user metadata
					const trackResult = await channelRef.current?.track({
						user_id: user.id,
						online_at: new Date().toISOString(),
					});
					console.log(
						`[Presence Tracker] ✅ Tracking presence for user: ${user.id}`,
						trackResult,
					);
				});
		};

		subscribeToPresence();

		// Cleanup: Update last_seen and unsubscribe
		return () => {
			if (channelRef.current) {
				console.log(
					`[Presence Tracker] 🔌 Unsubscribing and updating last_seen for user: ${user?.id}`,
				);

				// Update last_seen timestamp
				updateLastSeen.mutate({
					last_seen: new Date().toISOString(),
				});

				// Unsubscribe from channel
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]); // Only re-subscribe when user ID changes
}
