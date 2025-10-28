import { redirect } from "next/navigation";
import { RootLayout } from "@/components/layout/root-layout";
import { useMe } from "@/features/auth/api/get-me";
import { checkLoggedIn } from "@/lib/utils/auth";
import { useUser } from "@/stores/auth-store";

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// const { data: user } = useMe();
	// const router = useRouter();
	checkLoggedIn();

	// useEffect(() => {
	// if (!user) {
	// 	redirect("/auth/sign-in");
	// }
	// }, [user, router]);

	// if (!user) {
	// 	return null; // or loading spinner
	// }

	return <RootLayout>{children}</RootLayout>;
}
