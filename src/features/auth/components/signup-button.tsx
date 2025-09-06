import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { initiateGoogleOAuth } from "../api/google-oauth";

export function SignUpButton({ className }: { className?: string }) {
	const handleSignIn = () => {
		initiateGoogleOAuth();
	};
	return (
		<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
			<button
				type="button"
				className={cn(
					"bg-foreground text-background hover:bg-foreground/90 inline-flex items-center space-x-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200",
					className,
				)}
				onClick={handleSignIn}
			>
				<span>Get Started</span>
				<ArrowRight className="h-4 w-4" />
			</button>
		</motion.div>
	);
}
