import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserUpload } from "@/features/matching/store/user-upload";

interface UserPhotoProps {
	onChangePhoto: () => void;
}

export function UserPhoto({ onChangePhoto }: UserPhotoProps) {
	const userUpload = useUserUpload();

	// const [showFilters, setShowFilters] = useState(false);
	// const [currentFilter, setCurrentFilter] = useState<
	// 	"none" | "vintage" | "bw" | "sepia" | "vibrant"
	// >("none");

	// const applyFilter = async (filter: typeof currentFilter) => {
	// 	if (!originalImage) return;

	// 	setCurrentFilter(filter);

	// 	try {
	// 		const filtered = await ImageProcessor.applyFilter(originalImage, filter);
	// 		onPhotoUpload(filtered, selectedGender);
	// 	} catch (error) {
	// 		console.error("Filter failed:", error);
	// 	}
	// };

	// const applyFilter = async (filter: typeof currentFilter) => {
	// 	if (!originalImage) return;

	// 	setCurrentFilter(filter);

	// 	try {
	// 		const filtered = await ImageProcessor.applyFilter(originalImage, filter);
	// 		onPhotoUpload(filtered, selectedGender);
	// 	} catch (error) {
	// 		console.error("Filter failed:", error);
	// 	}
	// };

	return (
		<Card className="p-6 bg-gradient-card border-0 shadow-soft">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-center space-y-4"
			>
				<div className="relative inline-block">
					<Avatar className="size-32 rounded-full object-cover border-4 border-primary shadow-match">
						<AvatarImage
							src={userUpload.image_url}
							alt="User profile"
							className="object-cover"
						/>
						<AvatarFallback>
							{userUpload.gender === "male" ? "👨" : "👩"}
						</AvatarFallback>
					</Avatar>
					<Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
						{userUpload.gender === "male" ? "👨" : "👩"}
					</Badge>
				</div>

				<div className="flex gap-3 justify-center">
					{/* <Dialog open={showFilters} onOpenChange={setShowFilters}>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm" className="gap-2">
								<Sparkles className="w-4 h-4" />
								Filters
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>Photo Filters</DialogTitle>
							</DialogHeader>

							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-2">
									{(["none", "vintage", "bw", "sepia", "vibrant"] as const).map(
										(filter) => (
											<Button
												key={filter}
												variant={
													currentFilter === filter ? "default" : "outline"
												}
												size="sm"
												onClick={() => applyFilter(filter)}
												className="capitalize"
											>
												{filter === "none" ? "Original" : filter}
											</Button>
										),
									)}
								</div>

								<div className="space-y-2">
									<Label>Compression Quality: {compressionLevel[0]}%</Label>
									<Slider
										value={compressionLevel}
										onValueChange={setCompressionLevel}
										max={100}
										min={10}
										step={10}
										className="w-full"
									/>
								</div>
							</div>
						</DialogContent>
					</Dialog> */}

					<Button
						variant="outline"
						size="sm"
						onClick={onChangePhoto}
						className="gap-2"
					>
						<RotateCcw className="w-4 h-4" />
						Change Photo
					</Button>
				</div>
			</motion.div>
		</Card>
	);
}
