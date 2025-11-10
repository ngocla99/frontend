"use client";

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import {
	FileUpload,
	type FileUploadRef,
} from "@/components/kokonutui/file-upload";
import { Card } from "@/components/ui/card";
import { useUser } from "@/features/auth/api/get-me";
import { useUploadFace } from "@/features/matching/api/upload-face";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { UserPhoto } from "./user-photo";
import {
	ImageCrop,
	ImageCropContent,
	ImageCropApply,
	ImageCropReset,
} from "@/components/image-crop";
import { Button } from "@/components/ui/button";

// Helper function to convert base64 to File
const base64ToFile = async (
	base64: string,
	filename: string,
): Promise<File> => {
	const response = await fetch(base64);
	const blob = await response.blob();
	return new File([blob], filename, { type: blob.type });
};

export const UploadPhoto = ({ className }: { className?: string }) => {
	const isMobile = useIsMobile();
	const user = useUser();
	const [showSettings, setShowSettings] = React.useState<boolean>(false);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [showCropDialog, setShowCropDialog] = React.useState(false);
	const fileUploadRef = React.useRef<FileUploadRef>(null);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: () => {
				setShowSettings(false);
				setSelectedFile(null);
				setShowCropDialog(false);
			},
			onError: () => {
				fileUploadRef.current?.reset();
				setSelectedFile(null);
				setShowCropDialog(false);
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
		fileUploadRef.current?.reset();
	};

	if (user?.image && !showSettings) {
		return <UserPhoto />;
	}

	return (
		<Card
			className={cn(
				"p-0 shadow-none sm:p-6 bg-gradient-card border-0 sm:shadow-soft",
				isMobile && "bg-transparent",
				className,
			)}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-6"
			>
				{!showCropDialog ? (
					<>
						<div className="text-center">
							<h3 className="text-xl font-semibold text-foreground mb-2">
								Upload Your Photo
							</h3>
							<p className="text-muted-foreground text-sm">
								Start by uploading a clear photo
							</p>
						</div>

						<AnimatePresence>
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="space-y-4"
							>
								<FileUpload
									ref={fileUploadRef}
									onUploadSuccess={handleFileSelected}
									acceptedFileTypes={["image/*"]}
									maxFileSize={10 * 1024 * 1024} // 10MB
									uploadDelay={100}
									validateFile={() => null}
									classes={{ container: "w-full" }}
								/>
							</motion.div>
						</AnimatePresence>
					</>
				) : (
					selectedFile && (
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
					)
				)}
			</motion.div>
		</Card>
	);
};
