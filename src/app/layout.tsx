import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "@/styles/old-styles.css";
import { Toaster } from "@/components/ui/sonner";

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

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body suppressHydrationWarning>
				<Providers>{children}</Providers>
				<Toaster duration={3000} />
			</body>
		</html>
	);
}
