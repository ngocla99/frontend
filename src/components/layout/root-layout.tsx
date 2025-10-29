"use client";

import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { getUserPhotosQueryOptions } from "@/features/matching/api/get-user-photos";
import { useMatchRealtime } from "@/features/matching/hooks/use-live-match-realtime";
import { Header } from "./header";

export function RootLayout({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const [isPhotosPrefetching, setIsPhotosPrefetching] = React.useState(true);

	// Enable Supabase realtime for ALL new matches at app level
	// This keeps the connection alive even when user uploads photos
	useMatchRealtime();

	React.useEffect(() => {
		queryClient.prefetchQuery(getUserPhotosQueryOptions()).finally(() => {
			setIsPhotosPrefetching(false);
		});
	}, [queryClient]);

	// Show loading when either auth is loading or photos are being prefetched
	const isAppLoading = isPhotosPrefetching;

	return (
		<>
			<Header loading={isAppLoading} />
			{isAppLoading ? (
				<div className="min-h-screen flex items-center justify-center">
					<AITextLoading
						texts={["Matching...", "Loading...", "Please wait..."]}
					/>
				</div>
			) : (
				children
			)}
		</>
	);
}
