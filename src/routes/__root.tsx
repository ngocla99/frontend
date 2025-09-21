import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/root-layout";

interface Auth {
	isAuthenticated: boolean;
}

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	auth?: Auth;
}>()({
	component: RootLayout,
});
