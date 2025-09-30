import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { useMe } from "@/features/auth/api/get-me";
import { getUserPhotosQueryOptions } from "@/features/matching/api/get-user-photos";
import { Header } from "./header";

export function RootLayout() {
	const { data: user, isLoading } = useMe();
	const queryClient = useQueryClient();
	const [isPhotosPrefetching, setIsPhotosPrefetching] = useState(true);

	// Prefetch user photos when user is authenticated
	useEffect(() => {
		if (user && !isLoading) {
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
			<Header />
			{isAppLoading ? (
				<div className="min-h-screen flex items-center justify-center">
					<AITextLoading
						texts={["Matching...", "Loading...", "Please wait..."]}
					/>
				</div>
			) : (
				<Outlet />
			)}
			<Toaster duration={3000} />
			{import.meta.env.MODE === "development" && (
				<TanStackDevtools
					config={{
						position: "bottom-left",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						{
							name: "Tanstack Query",
							render: <ReactQueryDevtools />,
						},
					]}
				/>
			)}
		</>
	);
}
