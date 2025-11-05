import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
	isOnline: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

/**
 * Displays a colored dot indicator for online/offline status
 * Green dot for online, gray dot for offline
 */
export function OnlineIndicator({
	isOnline,
	size = "sm",
	className,
}: OnlineIndicatorProps) {
	const sizeClasses = {
		sm: "size-2",
		md: "size-2.5",
		lg: "size-3",
	};

	return (
		<div
			className={cn(
				"rounded-full",
				sizeClasses[size],
				isOnline ? "bg-green-500" : "bg-gray-400",
				className,
			)}
		/>
	);
}
