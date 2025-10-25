import type { Metadata } from "next";
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
	themeColor: "#000000",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<Providers>{children}</Providers>
				<Toaster duration={3000} />
			</body>
		</html>
	);
}
