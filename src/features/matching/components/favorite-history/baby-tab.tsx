import { AnimatePresence, motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	type BabyListItem,
	useBabyList,
} from "@/features/matching/api/get-baby-list";
import { useUserMatchesActions } from "@/features/matching/store/user-matches";
import { getTimeAgo } from "@/lib/utils/date";

export function BabyTab() {
	// Fetch all babies for current user
	const { data: babies = [], isLoading } = useBabyList();
	const { onOpen } = useUserMatchesActions();

	// Handle clicking a baby to view details
	const handleBabyClick = (baby: BabyListItem) => {
		onOpen(
			{
				user1: { name: baby.me.name, photo: baby.me.image || "" },
				user2: { name: baby.other.name, photo: baby.other.image || "" },
			},
			baby.id,
		);
	};

	// Show loading skeleton
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 px-4 md:px-0 gap-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<Card key={index} className="p-4 animate-pulse">
						<div className="space-y-3">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="flex items-center justify-between">
								<div className="w-12 h-12 bg-gray-200 rounded-full"></div>
								<div className="w-16 h-16 bg-gray-200 rounded-full"></div>
								<div className="w-12 h-12 bg-gray-200 rounded-full"></div>
							</div>
							<div className="flex justify-between">
								<div className="h-4 bg-gray-200 rounded w-20"></div>
								<div className="h-4 bg-gray-200 rounded w-24"></div>
							</div>
						</div>
					</Card>
				))}
			</div>
		);
	}

	// Empty state
	if (babies.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<div className="text-4xl mb-3">👶</div>
				<p>No baby generations yet</p>
				<p className="text-sm">Generate your first baby to see it here</p>
			</div>
		);
	}

	// Display baby history
	return (
		<ScrollArea className="h-[60vh] md:h-[70vh] pb-8 px-4 md:px-0">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<AnimatePresence>
					{babies.map((baby) => (
						<motion.div
							key={baby.id}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.2 }}
						>
							<Card
								className="p-4 group hover:shadow-md transition-shadow cursor-pointer"
								onClick={() => handleBabyClick(baby)}
							>
								<div className="space-y-3">
									{/* Header */}
									<div className="flex justify-between items-start">
										<h3 className="font-semibold text-sm">
											Baby with {baby.other.name}
										</h3>
									</div>

									{/* Photos Row */}
									<div className="flex items-center justify-between">
										<BlurImage
											src={baby.me.image || ""}
											alt={baby.me.name}
											width={48}
											height={48}
											className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
										/>

										{/* Display all baby images */}
										<div className="flex gap-2">
											{baby.images.slice(0, 3).map((img, index) => (
												<BlurImage
													key={img.id}
													src={img.image_url}
													alt={`Baby ${index + 1}`}
													width={64}
													height={64}
													className="w-16 h-16 rounded-full object-cover border-2 border-primary"
												/>
											))}
											{baby.images.length > 3 && (
												<div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
													+{baby.images.length - 3}
												</div>
											)}
										</div>

										<BlurImage
											src={baby.other.image || ""}
											alt={baby.other.name}
											width={48}
											height={48}
											className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
										/>
									</div>

									{/* Footer Info */}
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<Badge variant="outline" className="text-xs">
											{baby.images.length}{" "}
											{baby.images.length === 1 ? "baby" : "babies"}
										</Badge>
										<span className="flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											{getTimeAgo(baby.created_at)}
										</span>
									</div>
								</div>
							</Card>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</ScrollArea>
	);
}
