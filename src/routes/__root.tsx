import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import GeneralError from "@/components/errors/general-error";
import NotFoundError from "@/components/errors/not-found-error";
import { Toaster } from "@/components/ui/sonner";

interface Auth {
	isAuthenticated: boolean;
}

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	auth?: Auth;
}>()({
	component: () => {
		return (
			<>
				<Toaster duration={3000} />
				<Outlet />
				{import.meta.env.MODE === "development" && (
					<TanStackDevtools
						config={{
							position: "bottom-left",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							{
								name: "Tanstack Query",
								render: <ReactQueryDevtools />,
							},
						]}
					/>
				)}
			</>
		);
	},
	notFoundComponent: NotFoundError,
	errorComponent: GeneralError,
});
