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

export function UserPhoto() {
	const user = useUser();
	const fileUploadRef = React.useRef<FileUploadRef>(null);
	const [isUploading, setIsUploading] = React.useState<boolean>(false);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: () => {
				setIsUploading(false);
				fileUploadRef.current?.reset();
			},
			onError: () => {
				fileUploadRef.current?.reset();
			},
		},
	});

	const handleUploadFile = (file: File) => {
		if (uploadFaceMutation.isPending) return;
		uploadFaceMutation.mutate({ file });
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
					<FileUpload
						ref={fileUploadRef}
						onUploadSuccess={handleUploadFile}
						onSelectFile={handleSelectFile}
						acceptedFileTypes={["image/*"]}
						maxFileSize={10 * 1024 * 1024} // 10MB
						uploadDelay={100}
						validateFile={() => null}
						className="w-full"
					/>
				</motion.div>
			</AnimatePresence>
		</>
	);
}
