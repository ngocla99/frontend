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

// We are not prerendering anything because the app is highly dynamic
// and the data depends on the user so we need to send cookies with each request
export const dynamic = "force-dynamic";
