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

export const UploadPhoto = ({ className }: { className?: string }) => {
	const isMobile = useIsMobile();
	const user = useUser();
	const [showSettings, setShowSettings] = React.useState<boolean>(false);
	const fileUploadRef = React.useRef<FileUploadRef>(null);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: () => {
				setShowSettings(false);
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
							onUploadSuccess={handleUploadFile}
							acceptedFileTypes={["image/*"]}
							maxFileSize={10 * 1024 * 1024} // 10MB
							uploadDelay={100}
							validateFile={() => null}
							className="w-full"
						/>
					</motion.div>
				</AnimatePresence>
			</motion.div>
		</Card>
	);
};
