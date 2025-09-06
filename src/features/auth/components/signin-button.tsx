import { cn } from "@/lib/utils";
import { initiateGoogleOAuth } from "../api/google-oauth";

export function SignInButton({ className }: { className?: string }) {
	const handleSignIn = () => {
		initiateGoogleOAuth();
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
