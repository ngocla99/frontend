import { motion } from "framer-motion";
import React from "react";
import { ImageLoader } from "@/components/image-loader";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useUserPhotos } from "@/features/matching/api/get-user-photos";
import { cn } from "@/lib/utils";
import { PhotoFilterSkeleton } from "./photo-filter-skeleton";

interface PhotoFilterProps {
	activePhotoId: string | null;
	onPhotoSelect: (photoId: string | null) => void;
	className?: string;
}

export const PhotoFilter = ({
	activePhotoId,
	onPhotoSelect,
	className,
}: PhotoFilterProps) => {
	const { data: userPhotos, isLoading } = useUserPhotos();
	const uploads = userPhotos ?? [];

	const handleTabClick = (photoId: string | null) => {
		onPhotoSelect(photoId);
	};

	React.useEffect(() => {
		if (userPhotos) {
			onPhotoSelect(userPhotos[0].id);
		}
	}, [userPhotos]);

	// Show skeleton while loading
	if (isLoading) {
		return <PhotoFilterSkeleton className={className} />;
	}

	if (uploads.length <= 1) return null;

	return (
		<div className={cn("w-full", className)}>
			<ScrollArea className="w-full">
				<div className="flex gap-2 p-1 rounded-lg">
					{uploads.map((upload, index) => {
						const isActive = activePhotoId === upload.id;

						return (
							<motion.div
								key={upload.id}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button
									variant={isActive ? "default" : "outline"}
									size="sm"
									onClick={() => handleTabClick(upload.id)}
									className={cn(
										"flex items-center gap-2 transition-all duration-200 min-w-fit relative",
										isActive
											? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
											: "hover:bg-muted text-muted-foreground hover:text-foreground",
									)}
								>
									<ImageLoader
										src={upload.image_url}
										alt={`u${index}`}
										className="size-6"
										width={24}
										height={24}
									/>

									<div className="flex items-center gap-1">
										{/* <Camera className="w-4 h-4" /> */}
										<span className="font-medium">Photo {index + 1}</span>
									</div>

									{/* <Badge
										variant={isActive ? "secondary" : "outline"}
										className={cn(
											"ml-1 min-w-[24px] justify-center",
											isActive
												? "bg-white/20 text-white border-white/30"
												: "text-muted-foreground",
										)}
									>
										{matchCount}
									</Badge> */}
								</Button>
							</motion.div>
						);
					})}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
};
