"use client";

import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/contexts/theme-context";
import { handleServerError } from "@/lib/utils/handle-server-error";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: (failureCount, error) => {
							if (process.env.NODE_ENV === "development") {
								console.log({ failureCount, error });
							}
							if (failureCount >= 0) return false;

							return !(
								error instanceof AxiosError &&
								[401, 403].includes(error.response?.status ?? 0)
							);
						},
						refetchOnWindowFocus: process.env.NODE_ENV === "production",
						refetchOnMount: false,
						staleTime: 60 * 1000,
					},
					mutations: {
						onError: (error) => {
							handleServerError(error);

							if (error instanceof AxiosError) {
								if (error.response?.status === 304) {
									toast.error("Content not modified!");
								}
							}
						},
					},
				},
				queryCache: new QueryCache({
					onError: (error) => {
						if (error instanceof AxiosError) {
							if (error.response?.status === 401) {
								useAuthStore.getState().actions.reset();
							}
							if (error.response?.status === 500) {
								toast.error("Internal Server Error!");
								router.push("/500");
							}
							if (error.response?.status === 403) {
								router.push("/403");
							}
						}
					},
				}),
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
				{children}
			</ThemeProvider>
		</QueryClientProvider>
	);
}
