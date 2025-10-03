import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/root-layout";

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
		<RootLayout>
			<Outlet />
		</RootLayout>
	),
});
