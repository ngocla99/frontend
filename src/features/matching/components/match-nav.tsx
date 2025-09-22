import { useQueryClient } from "@tanstack/react-query";
import { FloatingNav } from "@/components/layout/floating-navbar";

const navItems = [
	{ name: "Your Matches", link: "/your-matches" },
	{ name: "Live", link: "/" },
];

export const MatchNav = () => {
	const queryClient = useQueryClient();
	const user = queryClient.getQueryData(["auth", "me"]);

	if (!user) return null;

	return <FloatingNav navItems={navItems} />;
};
