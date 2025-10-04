import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthActions } from "@/stores/auth-store";
import { useMe } from "../api/get-me";

export function MagicLinkCallback() {
	const router = useRouter();
	const { setSession, setUser } = useAuthActions();
	const [isProcessing, setIsProcessing] = React.useState(true);
	const [sessionReady, setSessionReady] = React.useState(false);

	const { data: user } = useMe({
		queryConfig: {
			enabled: sessionReady,
		},
	});

	// Timeout redirect after 30 seconds
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (isProcessing) {
				toast.error("Authentication timeout. Please try again.");
				router.navigate({ to: "/" });
			}
		}, 15000);

		return () => clearTimeout(timeoutId);
	}, [isProcessing, router]);

	// Handle auth callback - exchange code for session
	React.useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				// Check if we have an error in the URL
				const hashParams = new URLSearchParams(
					window.location.hash.substring(1),
				);
				const error = hashParams.get("error");
				const errorDescription = hashParams.get("error_description");

				if (error) {
					throw new Error(errorDescription || error);
				}

				// Supabase will automatically handle the PKCE code exchange
				// when detectSessionInUrl is enabled
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (sessionError) {
					console.error("❌ Session error:", sessionError);
					throw sessionError;
				}

				if (!session) {
					console.error("❌ No session found");
					throw new Error("No session found after authentication");
				}

				setSession(session);
				setSessionReady(true);
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
	}, [setSession, router]);

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
