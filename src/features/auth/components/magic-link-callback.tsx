"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function MagicLinkCallback() {
	const router = useRouter();

	// Timeout redirect after 30 seconds
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			toast.error("Authentication timeout. Please try again.");
			router.push("/");
		}, 15000);

		return () => clearTimeout(timeoutId);
	}, [router]);

	React.useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				const supabase = createClient();

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

				toast.success("Successfully signed in!");
				router.push("/");
			} catch (error) {
				console.error("Auth callback error:", error);
				toast.error(
					error instanceof Error ? error.message : "Authentication failed",
				);
				router.push("/");
			}
		};

		handleAuthCallback();
	}, [router]);

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
