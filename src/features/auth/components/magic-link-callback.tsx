import { useRouter, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useMe } from "../api/get-me";

export function MagicLinkCallback() {
	const router = useRouter();
	const { setAccessToken, setUser } = useAuth();
	const [isProcessing, setIsProcessing] = React.useState(true);
	const [accessToken, setLocalAccessToken] = React.useState<string | null>(
		null,
	);

	const searchParams = useSearch({ from: "/auth/callback" });

	const { data: user } = useMe({
		queryConfig: {
			enabled: !!accessToken,
		},
	});

	// Handle auth callback - extract token from URL
	React.useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				// Backend redirects with ?token=... or ?error=...
				const token = searchParams.token;
				const error = searchParams.error;

				if (error) {
					throw new Error(error);
				}

				if (!token) {
					throw new Error("No token received");
				}

				console.log("🚀 ~ Received backend token");
				setAccessToken(token);
				setLocalAccessToken(token);
			} catch (error) {
				console.error("Auth callback error:", error);
				toast.error(
					error instanceof Error ? error.message : "Authentication failed",
				);
				router.navigate({ to: "/" });
			} finally {
				setIsProcessing(false);
			}
		};

		handleAuthCallback();
	}, [searchParams, setAccessToken, router]);

	// Redirect after user data is loaded
	React.useEffect(() => {
		if (user && !isProcessing) {
			setUser(user);
			toast.success("Successfully signed in!");
			router.navigate({ to: "/" });
		}
	}, [user, isProcessing, setUser, router]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
				<p className="mt-4 text-sm text-muted-foreground">
					Completing authentication...
				</p>
			</div>
		</div>
	);
}
