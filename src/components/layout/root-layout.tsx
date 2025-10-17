import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { useMe } from "@/features/auth/api/get-me";
import { getUserPhotosQueryOptions } from "@/features/matching/api/get-user-photos";
import { useAuthActions } from "@/stores/auth-store";
import { Header } from "./header";

export function RootLayout({ children }: { children: React.ReactNode }) {
	const { data: user, isLoading } = useMe({
		queryConfig: { staleTime: 10 * 60 * 1000 },
	});
	const { setUser } = useAuthActions();
	const queryClient = useQueryClient();
	const [isPhotosPrefetching, setIsPhotosPrefetching] = useState(true);

	// Prefetch user photos when user is authenticated
	useEffect(() => {
		if (user && !isLoading) {
			setUser(user);
			setIsPhotosPrefetching(true);
			queryClient.prefetchQuery(getUserPhotosQueryOptions()).finally(() => {
				setIsPhotosPrefetching(false);
			});
		} else if (!isLoading && !user) {
			// No user authenticated, no need to prefetch photos
			setIsPhotosPrefetching(false);
		}
	}, [user, isLoading, queryClient]);

	// Show loading when either auth is loading or photos are being prefetched
	const isAppLoading = isLoading || isPhotosPrefetching;

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
