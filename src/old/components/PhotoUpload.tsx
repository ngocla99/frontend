/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
/** biome-ignore-all lint/a11y/noRedundantAlt: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { Camera, Image, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PhotoUploadProps {
	onPhotoUpload: (photo: string, gender: string) => void;
	userPhoto?: { photo: string; gender: string };
}

export const PhotoUpload = ({ onPhotoUpload, userPhoto }: PhotoUploadProps) => {
	const [selectedGender, setSelectedGender] = useState<string>("");
	const [dragActive, setDragActive] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const processPhotoUpload = async (file: File, gender: string) => {
		setIsUploading(true);
		setUploadProgress(0);

		// Scroll to top smoothly
		window.scrollTo({ top: 0, behavior: "smooth" });

		// Simulate upload progress
		const progressInterval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 90) {
					clearInterval(progressInterval);
					return 90;
				}
				return prev + Math.random() * 20;
			});
		}, 100);

		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 1500));

		clearInterval(progressInterval);
		setUploadProgress(100);

		// Small delay to show 100% completion
		await new Promise((resolve) => setTimeout(resolve, 300));

		const photoUrl = URL.createObjectURL(file);
		onPhotoUpload(photoUrl, gender);
		setSelectedGender("");
		setIsUploading(false);
		setUploadProgress(0);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedGender) {
			const file = e.dataTransfer.files[0];
			await processPhotoUpload(file, selectedGender);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0] && selectedGender) {
			const file = e.target.files[0];
			await processPhotoUpload(file, selectedGender);
		}
	};

	const handlePhotoLibraryUpload = () => {
		if (!selectedGender) return;

		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.multiple = false;
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await processPhotoUpload(file, selectedGender);
			}
		};
		input.click();
	};

	return (
		<Card className="p-4 sm:p-6 bg-gradient-card shadow-soft border-0 hover:shadow-match transition-all duration-300">
			{!userPhoto ? (
				<>
					<div className="text-center mb-4 sm:mb-6">
						<div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
							<Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
						</div>
						<h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
							Ready to Find Your Match?
						</h2>
						<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
							Just 2 simple steps: Choose your gender → Upload your selfie
						</p>
					</div>

					{/* Upload Progress */}
					{isUploading && (
						<div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
							<div className="text-center mb-3">
								<div className="w-8 h-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center animate-pulse">
									<Upload className="w-4 h-4 text-white" />
								</div>
								<h3 className="text-lg font-semibold text-primary mb-1">
									Processing your photo...
								</h3>
								<p className="text-sm text-muted-foreground">
									This will only take a moment
								</p>
							</div>
							<Progress value={uploadProgress} className="w-full" />
							<p className="text-xs text-center text-muted-foreground mt-2">
								{Math.round(uploadProgress)}% complete
							</p>
						</div>
					)}

					<div className="space-y-4 sm:space-y-6">
						{/* Gender Selection */}
						<div>
							<Label className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 block">
								Step 1: I am...
							</Label>
							<RadioGroup
								value={selectedGender}
								onValueChange={setSelectedGender}
								className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
								disabled={isUploading}
							>
								<div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
									<RadioGroupItem value="male" id="male" />
									<Label
										htmlFor="male"
										className="flex-1 cursor-pointer font-medium text-sm sm:text-base"
									>
										👨 Male
									</Label>
								</div>
								<div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
									<RadioGroupItem value="female" id="female" />
									<Label
										htmlFor="female"
										className="flex-1 cursor-pointer font-medium text-sm sm:text-base"
									>
										👩 Female
									</Label>
								</div>
							</RadioGroup>
						</div>

						{/* Photo Upload */}
						<div>
							<Label className="text-base sm:text-lg font-display font-semibold mb-3 sm:mb-4 block">
								Step 2: Upload Your Selfie
							</Label>
							{!selectedGender && !isUploading && (
								<p className="text-xs sm:text-sm text-amber-600 mb-3 sm:mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
									⚠️ Please select your gender first
								</p>
							)}

							{/* Upload Options */}
							<div className="space-y-4">
								{/* Photo Library Button - More Prominent */}
								<Button
									variant="default"
									onClick={handlePhotoLibraryUpload}
									disabled={!selectedGender || isUploading}
									className="w-full gap-2 h-12 text-base font-medium"
								>
									<Image className="w-5 h-5" />📱 Choose from Photo Library
								</Button>

								{/* Divider */}
								<div className="flex items-center gap-4">
									<div className="flex-1 h-px bg-border"></div>
									<span className="text-xs text-muted-foreground">OR</span>
									<div className="flex-1 h-px bg-border"></div>
								</div>

								{/* Drag & Drop Area */}
								<div
									className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all cursor-pointer ${
										dragActive ? "border-primary bg-primary/5" : "border-border"
									} ${!selectedGender || isUploading ? "opacity-50 pointer-events-none" : "hover:border-primary/50"}`}
									onDragEnter={handleDrag}
									onDragLeave={handleDrag}
									onDragOver={handleDrag}
									onDrop={handleDrop}
								>
									<Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
									<div className="space-y-2 sm:space-y-3">
										<p className="text-base sm:text-lg font-medium text-foreground">
											📸 Take Photo or Upload
										</p>
										<p className="text-xs sm:text-sm text-muted-foreground">
											JPG, PNG, WEBP • Max 10MB
										</p>
										<p className="text-xs text-muted-foreground hidden sm:block">
											Make sure your face is clearly visible for better matches
										</p>
									</div>
									<input
										type="file"
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
										accept="image/jpeg,image/png,image/webp"
										onChange={handleFileChange}
										disabled={!selectedGender || isUploading}
									/>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				/* User Already Uploaded */
				<div className="text-center py-4 sm:py-0 animate-fade-in">
					<div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-green-500 animate-scale-in">
						<img
							src={userPhoto.photo}
							alt="Your photo"
							className="w-full h-full object-cover"
						/>
					</div>
					<h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
						✓ You're In!
					</h3>
					<p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
						Looking for matches...
					</p>
					<Button
						variant="outline"
						onClick={() => onPhotoUpload("", "")} // Reset photo
						className="gap-2 text-sm sm:text-base h-9 sm:h-10"
					>
						<Camera className="w-4 h-4" />
						Change Photo
					</Button>
				</div>
			)}
		</Card>
	);
};
