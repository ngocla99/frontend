import { createFileRoute } from "@tanstack/react-router";
import { MagicLinkForm } from "@/features/auth/components/magic-link-form";

export const Route = createFileRoute("/auth/sign-up")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<MagicLinkForm mode="signup" />
		</div>
	);
}
