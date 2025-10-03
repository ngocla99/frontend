import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";

export const Route = createFileRoute("/auth")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<Header />
			<Outlet />
		</>
	);
}
