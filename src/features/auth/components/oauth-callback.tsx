import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useAuthActions } from "@/stores/auth-store";
import { useMe } from "../api/get-me";
import { extractOAuthParams } from "../api/google-oauth";

export function OAuthCallback() {
	const router = useRouter();
	const { setAccessToken, setUser } = useAuthActions();

	const searchParams = useSearchParams();
	const accessToken = searchParams.get("token");

	const { data: user } = useMe({
		queryConfig: {
			enabled: !!accessToken,
		},
	});

	React.useEffect(() => {
		if (user) {
			setUser(user);

			router.push("/");
		}
	}, [user, router, setUser]);

	React.useEffect(() => {
		const { error } = extractOAuthParams();
		if (error) {
			toast.error(`OAuth error: ${error}`);
			router.push("/");
			return;
		}

		if (accessToken) {
			setAccessToken(accessToken);
			return;
		}

		toast.error("No access token received from authentication");
		router.push("/");
	}, [accessToken, router, setAccessToken]);

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
