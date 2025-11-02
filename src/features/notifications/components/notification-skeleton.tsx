import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for notification items
 */
export function NotificationSkeleton() {
	return (
		<div className="w-full px-4 py-3">
			<div className="flex gap-3">
				{/* Icon skeleton */}
				<Skeleton className="flex-shrink-0 h-5 w-5 rounded-full mt-1" />

				{/* Content skeleton */}
				<div className="flex-1 min-w-0 space-y-2">
					{/* Title skeleton */}
					<Skeleton className="h-4 w-3/4" />

					{/* Message skeleton */}
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />

					{/* Timestamp skeleton */}
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
		</div>
	);
}

/**
 * Multiple notification skeletons for loading state
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="w-full">
			{Array.from({ length: count }).map((_, i) => (
				<NotificationSkeleton key={i} />
			))}
		</div>
	);
}
