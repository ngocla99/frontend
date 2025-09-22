import { FloatingNav } from "@/components/layout/floating-navbar";
import { useReadMeQuery } from "@/features/auth/api/get-me";

const navItems = [
	{ name: "Your Matches", link: "/your-matches" },
	{ name: "Live", link: "/" },
];

export const MatchNav = () => {
	const user = useReadMeQuery();

	if (!user) return null;

	return <FloatingNav navItems={navItems} />;
};
