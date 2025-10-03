import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PhotoFilterSkeletonProps {
	className?: string;
}

export const PhotoFilterSkeleton = ({
	className,
}: PhotoFilterSkeletonProps) => {
	return (
		<div className={cn("w-full", className)}>
			<ScrollArea className="w-full">
				<div className="flex gap-2 p-1 rounded-lg">
					{/* Generate 2-3 skeleton photo tabs */}
					{Array.from({ length: 3 }).map((_, index) => (
						<Skeleton
							key={index}
							className="flex items-center gap-2 transition-all duration-200 min-w-fit relative h-9 px-3 rounded-md"
						>
							{/* Photo thumbnail skeleton */}
							<div className="size-6 bg-muted-foreground/20 rounded-full" />

							{/* Photo label skeleton */}
							<div className="flex items-center gap-1">
								<div className="h-4 w-14 bg-muted-foreground/20 rounded" />
							</div>
						</Skeleton>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
};
