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
import { base64ToFile } from "../../utils";
import { ImageCropDialog } from "./image-crop-dialog";
import { UserPhoto } from "./user-photo";

export const UploadPhoto = ({ className }: { className?: string }) => {
	const isMobile = useIsMobile();
	const user = useUser();
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [showCropDialog, setShowCropDialog] = React.useState(false);
	const fileUploadRef = React.useRef<FileUploadRef>(null);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: () => {
				setSelectedFile(null);
			},
			onError: () => {
				fileUploadRef.current?.reset();
				setSelectedFile(null);
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
		setShowCropDialog(false);
		uploadFaceMutation.mutate({ file: croppedFile });
	};

	const handleCancelCrop = () => {
		setShowCropDialog(false);
		setSelectedFile(null);
		fileUploadRef.current?.reset();
	};

	if (user?.image) {
		return <UserPhoto />;
	}

	return (
		<>
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
				</motion.div>
			</Card>
			<ImageCropDialog
				open={showCropDialog}
				file={selectedFile}
				onCancelCrop={handleCancelCrop}
				onCrop={handleCropComplete}
				onOpenChange={setShowCropDialog}
			/>
		</>
	);
};
