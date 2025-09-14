/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/noRedundantAlt: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */

import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GenderSelection } from "@/features/matching/components/gender-selection";
import { PhotoUploadSection } from "@/features/matching/components/photo-upload-section";
import { ImageProcessor } from "@/old/lib/imageUtils";
import { storage } from "@/old/lib/storage";
import { GenerateButton } from "./generate-button";

interface EnhancedPhotoUploadProps {
	onPhotoUpload: (photo: string, gender: string) => void;
	userPhoto?: { photo: string; gender: string };
}

export const PhotoUpload = ({
	onPhotoUpload,
	userPhoto,
}: EnhancedPhotoUploadProps) => {
	const [selectedGender, setSelectedGender] = useState<string>(
		userPhoto?.gender || "",
	);
	const [isUploading, setIsUploading] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [currentFilter, setCurrentFilter] = useState<
		"none" | "vintage" | "bw" | "sepia" | "vibrant"
	>("none");
	const [compressionLevel, setCompressionLevel] = useState([80]);
	const [originalImage, setOriginalImage] = useState<string>("");
	const [filteredImage, setFilteredImage] = useState<string>("");

	const applyFilter = async (filter: typeof currentFilter) => {
		if (!originalImage) return;

		setCurrentFilter(filter);

		try {
			const filtered = await ImageProcessor.applyFilter(originalImage, filter);
			setFilteredImage(filtered);
			onPhotoUpload(filtered, selectedGender);
		} catch (error) {
			console.error("Filter failed:", error);
		}
	};

	const resetPhoto = () => {
		setOriginalImage("");
		setFilteredImage("");
		setCurrentFilter("none");
		onPhotoUpload("", "");
		storage.trackEvent("photo_reset");
	};

	if (userPhoto) {
		return (
			<Card className="p-6 bg-gradient-card border-0 shadow-soft">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center space-y-4"
				>
					<div className="relative inline-block">
						<img
							src={userPhoto.photo}
							alt="Your photo"
							className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-match"
						/>
						<Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
							{userPhoto.gender === "male" ? "👨" : "👩"}
						</Badge>
					</div>

					<div className="flex gap-3 justify-center">
						<Dialog open={showFilters} onOpenChange={setShowFilters}>
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
										{(
											["none", "vintage", "bw", "sepia", "vibrant"] as const
										).map((filter) => (
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
										))}
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
						</Dialog>

						<Button
							variant="outline"
							size="sm"
							onClick={resetPhoto}
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

	return (
		<Card className="p-6 bg-gradient-card border-0 shadow-soft">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-6"
			>
				<PhotoUploadSection
					step={1}
					title="Your Photo"
					description="click to upload JPG or PNG images"
					variant="purple"
					onPhotoUpload={() => {}}
				/>

				{/* Gender Selection */}
				<div className="sticky bottom-0 backdrop-blur-md border-t border-black/10 p-12 space-y-4">
					<GenderSelection
						selectedGender={selectedGender as "male" | "female"}
						onGenderChange={setSelectedGender}
					/>

					<GenerateButton
						isGenerating={isUploading}
						isDisabled={true}
						onGenerate={() => {}}
					/>
				</div>
			</motion.div>
		</Card>
	);
};
