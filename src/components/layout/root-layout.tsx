import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { useMe } from "@/features/auth/api/get-me";
import { Header } from "./header";

export function RootLayout() {
	const { isLoading } = useMe();

	return (
		<>
			<Header />
			{isLoading ? (
				<div className="min-h-screen flex items-center justify-center">
					<AITextLoading
						texts={["Matching...", "Loading...", "Please wait..."]}
					/>
				</div>
			) : (
				<Outlet />
			)}
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
