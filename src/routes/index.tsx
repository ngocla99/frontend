import { createFileRoute } from "@tanstack/react-router";
import Index from "@/old/pages/Index";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="mt-20">
			<Index />
		</div>
	);
}
