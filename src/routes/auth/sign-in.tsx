import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign-in")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Navigate to="/" />;
}
