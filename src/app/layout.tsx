import { Toaster } from "@/components/ui/sonner";
import { getMeQueryOptions } from "@/features/auth/api/get-me";
import "@/styles/old-styles.css";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Fuzed - University Match & Baby Generator",
	description: "AI Face Matching Application",
	icons: {
		icon: "/favicon.ico",
		apple: "/logo192.png",
	},
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: "#000000",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const queryClient = new QueryClient();

	await queryClient.prefetchQuery(getMeQueryOptions());

	const dehydratedState = dehydrate(queryClient);

	return (
		<html lang="en" suppressHydrationWarning>
			<body suppressHydrationWarning>
				<Providers>
					<HydrationBoundary state={dehydratedState}>
						{children}
					</HydrationBoundary>
				</Providers>
				<Toaster duration={3000} />
			</body>
		</html>
	);
}

// Note: Removed force-dynamic from root layout for performance optimization
// Dynamic rendering is now handled per-route as needed:
// - Authenticated routes use force-dynamic via (authenticated)/layout.tsx
// - Public API routes use appropriate caching strategies (see vercel.json)
// - Pages with auth checks are naturally dynamic due to cookie dependencies
