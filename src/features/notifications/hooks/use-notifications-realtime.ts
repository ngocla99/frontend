"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "../types";

interface UseNotificationsRealtimeOptions {
	userId: string;
	enabled?: boolean;
	onNotification?: (notification: Notification) => void;
}

/**
 * Hook to subscribe to real-time notification updates
 *
 * Listens to the user-specific notification broadcast channel
 * and automatically invalidates notification queries when new notifications arrive
 */
export function useNotificationsRealtime({
	userId,
	enabled = true,
	onNotification,
}: UseNotificationsRealtimeOptions) {
	const queryClient = useQueryClient();
	const channelRef = useRef<RealtimeChannel | null>(null);
	const onNotificationRef = useRef(onNotification);

	// Keep callback up to date
	useEffect(() => {
		onNotificationRef.current = onNotification;
	}, [onNotification]);

	useEffect(() => {
		if (!enabled || !userId) {
			return;
		}

		const supabase = createClient();
		const channelName = `user:${userId}:notifications`;

		// Subscribe to broadcast channel for this user
		channelRef.current = supabase
			.channel(channelName)
			.on("broadcast", { event: "notification" }, ({ payload }) => {
				const notification = payload as Notification;

				// Call custom callback if provided
				if (onNotificationRef.current) {
					onNotificationRef.current(notification);
				}

				// Invalidate notifications queries to refetch updated data
				queryClient.invalidateQueries({ queryKey: ["notifications"] });
			})
			.subscribe((status) => {
				if (status === "CHANNEL_ERROR") {
					console.error("❌ Notifications realtime connection failed");
				} else if (status === "TIMED_OUT") {
					console.error("⏱️ Notifications realtime subscription timeout");
				} else if (status === "SUBSCRIBED") {
					console.log("✅ Notifications realtime connected");
				}
			});

		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [userId, enabled, queryClient]);

	return {
		isConnected: channelRef.current?.state === "joined",
	};
}
