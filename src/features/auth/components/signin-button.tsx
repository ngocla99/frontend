"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SignInButton({ className }: { className?: string }) {
	const router = useRouter();

	const handleSignIn = () => {
		router.push("/auth/sign-in");
	};

	return (
		<button
			type="button"
			onClick={handleSignIn}
			className={cn(
				"text-foreground/80 hover:text-foreground px-4 py-2 text-sm font-medium transition-colors duration-200",
				className,
			)}
		>
			Sign In
		</button>
	);
}
