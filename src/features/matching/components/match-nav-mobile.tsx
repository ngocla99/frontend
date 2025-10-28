import { FloatingNav } from "@/components/layout/floating-navbar";
import { useUser } from "@/features/auth/api/get-me";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
	{ name: "Your Matches", link: "/your-matches" },
	{ name: "Live", link: "/" },
];

export const MatchNavMobile = () => {
	const user = useUser();
	const isMobile = useIsMobile();

	if (!user || !isMobile) return null;

	return <FloatingNav navItems={navItems} />;
};
