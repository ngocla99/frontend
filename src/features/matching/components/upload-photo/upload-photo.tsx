import { AnimatePresence, motion } from "framer-motion";
import { type SetStateAction, useState } from "react";
import { FileUpload } from "@/components/kokonutui/file-upload";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUploadFace } from "@/features/matching/api/upload-face";
import { useUserUpload } from "@/features/matching/store/user-upload";
import { useUpdateMe } from "@/features/user/api/update-me";
import { UserPhoto } from "./user-photo";

export const UploadPhoto = () => {
	const userUpload = useUserUpload();
	const [selectedGender, setSelectedGender] = useState<string>(
		userUpload.gender || "",
	);

	const uploadFaceMutation = useUploadFace();
	const updateMeMutation = useUpdateMe();

	const handleUploadFile = (file: File) => {
		if (uploadFaceMutation.isPending) return;
		uploadFaceMutation.mutate({ file });
	};

	const handleUpdateMe = () => {
		updateMeMutation.mutate({ gender: selectedGender });
	};

	if (userUpload?.photo) {
		return <UserPhoto />;
	}

	return (
		<Card className="p-6 bg-gradient-card border-0 shadow-soft">
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
						Start by selecting your gender and uploading a clear photo
					</p>
				</div>

				{/* Gender Selection */}
				<div className="space-y-3">
					<Label className="text-sm font-medium">Select your gender:</Label>
					<RadioGroup
						value={selectedGender}
						onValueChange={(value: SetStateAction<string>) => {
							setSelectedGender(value);
							handleUpdateMe();
						}}
						className="flex gap-6 justify-center"
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="male" id="male" />
							<Label htmlFor="male" className="cursor-pointer">
								👨 Male
							</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="female" id="female" />
							<Label htmlFor="female" className="cursor-pointer">
								👩 Female
							</Label>
						</div>
					</RadioGroup>
				</div>

				{/* Upload Area */}
				<AnimatePresence>
					{selectedGender && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="space-y-4"
						>
							<FileUpload
								onUploadSuccess={handleUploadFile}
								acceptedFileTypes={["image/*"]}
								maxFileSize={10 * 1024 * 1024} // 10MB
								uploadDelay={2000}
								validateFile={() => null}
								className="w-full"
								onFileRemove={() => {}}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{!selectedGender && (
					<div className="text-center py-4">
						<p className="text-sm text-muted-foreground">
							👆 Please select your gender first
						</p>
					</div>
				)}
			</motion.div>
		</Card>
	);
};
