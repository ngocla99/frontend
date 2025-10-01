import { Skeleton } from "@/components/ui/skeleton";

export const UniversityMatchSkeleton = () => (
	<div className="w-full p-4 sm:p-5 rounded-xl border-2 border-gray-200 bg-white">
		{/* Main content with left-center-right layout skeleton */}
		<div className="flex items-center justify-between mb-4">
			{/* Left User Skeleton */}
			<div className="flex flex-col items-center gap-2">
				{/* Avatar with gradient blur effect skeleton */}
				<div className="relative">
					<div className="absolute inset-0 bg-gray-200 rounded-full blur-[2px]" />
					<Skeleton className="relative w-14 h-14 rounded-full" />
				</div>
				<div className="text-center space-y-1">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-2 w-10" />
				</div>
			</div>

			{/* Center Match Info Skeleton */}
			<div className="flex flex-col items-center gap-1 px-3">
				{/* Heart Icon Skeleton */}
				<div className="relative">
					<div className="absolute inset-0 bg-gray-200 rounded-full blur-[2px]" />
					<Skeleton className="relative w-6 h-6 rounded-full" />
				</div>

				{/* Match Percentage Skeleton */}
				<div className="text-center space-y-1">
					<div className="flex items-center gap-1">
						<Skeleton className="h-6 w-12" />
						<Skeleton className="w-4 h-4 rounded-full" />
					</div>
					<Skeleton className="h-2 w-16" />
				</div>

				{/* Match Count Badge Skeleton */}
				<div className="mt-2">
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
			</div>

			{/* Right User Skeleton */}
			<div className="flex flex-col items-center gap-2">
				{/* Avatar with gradient blur effect skeleton */}
				<div className="relative">
					<div className="absolute inset-0 bg-gray-200 rounded-full blur-[2px]" />
					<Skeleton className="relative w-14 h-14 rounded-full" />
				</div>
				<div className="text-center space-y-1">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-2 w-10" />
				</div>
			</div>
		</div>

		{/* Footer Skeleton */}
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<Skeleton className="h-3 w-20" />
			</div>

			<div className="flex items-center gap-2">
				<Skeleton className="h-6 w-6 rounded-full" />
				<Skeleton className="h-6 w-20 rounded-full" />
			</div>
		</div>
	</div>
);
