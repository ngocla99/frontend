import { cn } from "@/lib/utils";
import { useSignOut } from "../api/sign-out";

interface SignOutButtonProps {
	className?: string;
	onClose?: () => void;
}

export function SignOutButton({ className, onClose }: SignOutButtonProps) {
	const signOutMutation = useSignOut({
		mutationConfig: {
			onSuccess: () => onClose?.(),
		},
	});

	const handleSignOut = () => {
		signOutMutation.mutate(undefined);
	};

	return (
		<button
			type="button"
			onClick={handleSignOut}
			disabled={signOutMutation.isPending}
			className={cn(
				"text-foreground/80 hover:text-foreground px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-50",
				className,
			)}
		>
			{signOutMutation.isPending ? "Signing out..." : "Sign Out"}
		</button>
	);
}
