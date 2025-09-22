import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { useMe } from "@/features/auth/api/get-me";
import { MatchingSkeleton } from "@/features/matching/components/matching-skeleton";
import { Header } from "./header";

export function RootLayout() {
	const { isLoading } = useMe();

	return (
		<>
			<Header />
			{isLoading ? <MatchingSkeleton /> : <Outlet />}
			<Toaster duration={3000} />
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
}
