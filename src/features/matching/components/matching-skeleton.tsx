import { Skeleton } from "@/components/ui/skeleton";

export function MatchingSkeleton() {
	return (
		<div className="pt-20 min-h-screen bg-gradient-subtle">
			<div className="container mx-auto py-4 sm:py-6 lg:py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
					<div className="space-y-8">
						{/* Loading skeleton for favorites manager */}
						<div className="flex gap-4 items-center mb-4">
							<Skeleton className="h-12 w-48" />
						</div>

						{/* Loading skeleton for upload photo */}
						<div className="space-y-4">
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-32 w-full rounded-lg" />
						</div>

						{/* Loading skeleton for user match */}
						<div className="space-y-4">
							<Skeleton className="h-8 w-40" />
							<Skeleton className="h-48 w-full rounded-lg" />
						</div>
					</div>

					{/* Loading skeleton for live match */}
					<div className="space-y-4">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="h-96 w-full rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}
