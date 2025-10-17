import { FloatingNav } from "@/components/layout/floating-navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/stores/auth-store";

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
