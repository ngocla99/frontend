import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		if (!context?.auth?.isAuthenticated) {
			throw redirect({
				to: "/",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: () => (
		<>
			<Header />
			<Outlet />
		</>
	),
});
