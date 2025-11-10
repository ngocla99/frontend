import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import React from "react";
import { BlurImage } from "@/components/blur-image";
import {
	FileUpload,
	type FileUploadRef,
} from "@/components/kokonutui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@/features/auth/api/get-me";
import { cn } from "@/lib/utils";
import { useUploadFace } from "../../api/upload-face";
import { FavoriteHistory } from "../favorite-history/favorite-history";
import {
	ImageCrop,
	ImageCropContent,
	ImageCropApply,
	ImageCropReset,
} from "@/components/image-crop";

// Helper function to convert base64 to File
const base64ToFile = async (
	base64: string,
	filename: string,
): Promise<File> => {
	const response = await fetch(base64);
	const blob = await response.blob();
	return new File([blob], filename, { type: blob.type });
};

export function UserPhoto() {
	const user = useUser();
	const fileUploadRef = React.useRef<FileUploadRef>(null);
	const [isUploading, setIsUploading] = React.useState<boolean>(false);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [showCropDialog, setShowCropDialog] = React.useState(false);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: () => {
				setIsUploading(false);
				setSelectedFile(null);
				setShowCropDialog(false);
				fileUploadRef.current?.reset();
			},
			onError: () => {
				setSelectedFile(null);
				setShowCropDialog(false);
				fileUploadRef.current?.reset();
			},
		},
	});

	const handleFileSelected = (file: File) => {
		setSelectedFile(file);
		setShowCropDialog(true);
	};

	const handleCropComplete = async (croppedImageBase64: string) => {
		if (uploadFaceMutation.isPending) return;

		const croppedFile = await base64ToFile(
			croppedImageBase64,
			selectedFile?.name || "cropped-image.png",
		);
		uploadFaceMutation.mutate({ file: croppedFile });
	};

	const handleCancelCrop = () => {
		setShowCropDialog(false);
		setSelectedFile(null);
		setIsUploading(false);
		fileUploadRef.current?.reset();
	};

	const handleChangePhoto = () => {
		fileUploadRef.current?.triggerFileInput();
	};

	const handleSelectFile = () => {
		setIsUploading(true);
	};

	return (
		<>
			<Card
				className={cn(
					"p-6 bg-gradient-card border-0 shadow-soft",
					isUploading ? "hidden" : "block",
				)}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center space-y-8"
				>
					<div className="relative inline-block">
						<div>
							<BlurImage
								src={user?.image || ""}
								alt="User profile"
								width={128}
								height={128}
								className="size-32 rounded-full shadow-match"
							/>
						</div>
						<Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
							{user?.gender === "male" ? "👨" : "👩"}
						</Badge>
					</div>

					<div className="flex gap-3 justify-center mb-2">
						<FavoriteHistory />
						<Button
							variant="outline"
							size="sm"
							onClick={handleChangePhoto}
							className="gap-2"
						>
							<RotateCcw className="w-4 h-4" />
							Change Photo
						</Button>
					</div>
				</motion.div>
			</Card>
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className={cn("space-y-4", isUploading ? "block" : "sr-only")}
				>
					{showCropDialog && selectedFile ? (
						<Card className="p-6 bg-gradient-card border-0 shadow-soft">
							<div className="space-y-4">
								<div className="text-center">
									<h3 className="text-xl font-semibold text-foreground mb-2">
										Crop Your Photo
									</h3>
									<p className="text-muted-foreground text-sm">
										Adjust the crop area to frame your face
									</p>
								</div>

								<ImageCrop
									file={selectedFile}
									onCrop={handleCropComplete}
									aspect={1}
									circularCrop
								>
									<div className="space-y-4">
										<div className="flex justify-center">
											<ImageCropContent className="rounded-lg overflow-hidden" />
										</div>

										<div className="flex justify-center gap-2">
											<ImageCropReset>
												<Button variant="outline" size="sm">
													Reset
												</Button>
											</ImageCropReset>
											<Button
												variant="outline"
												size="sm"
												onClick={handleCancelCrop}
											>
												Cancel
											</Button>
											<ImageCropApply>
												<Button size="sm" disabled={uploadFaceMutation.isPending}>
													{uploadFaceMutation.isPending
														? "Uploading..."
														: "Apply & Upload"}
												</Button>
											</ImageCropApply>
										</div>
									</div>
								</ImageCrop>
							</div>
						</Card>
					) : (
						<FileUpload
							ref={fileUploadRef}
							onUploadSuccess={handleFileSelected}
							onSelectFile={handleSelectFile}
							acceptedFileTypes={["image/*"]}
							maxFileSize={10 * 1024 * 1024} // 10MB
							uploadDelay={100}
							validateFile={() => null}
							classes={{ container: "w-full" }}
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</>
	);
}
