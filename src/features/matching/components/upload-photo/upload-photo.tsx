import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { AuthGuard } from "@/components/auth-guard";
import {
	FileUpload,
	type FileUploadRef,
} from "@/components/kokonutui/file-upload";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUploadFace } from "@/features/matching/api/upload-face";
import {
	useUserUpload,
	useUserUploadActions,
} from "@/features/matching/store/user-upload";
import { useUpdateMe } from "@/features/user/api/update-me";
import { UserPhoto } from "./user-photo";

export const UploadPhoto = () => {
	const userUpload = useUserUpload();
	const { setUserUpload } = useUserUploadActions();
	const [showSettings, setShowSettings] = React.useState<boolean>(false);
	const [selectedGender, setSelectedGender] = React.useState<string>(
		userUpload.gender || "",
	);
	const fileUploadRef = React.useRef<FileUploadRef>(null);

	const uploadFaceMutation = useUploadFace({
		mutationConfig: {
			onSuccess: (data) => {
				setUserUpload({ ...userUpload, image_url: data.image_url });
				setShowSettings(false);
			},
			onError: () => {
				fileUploadRef.current?.reset();
			},
		},
	});
	const updateMeMutation = useUpdateMe();

	React.useEffect(() => {
		setSelectedGender(userUpload.gender || "");
	}, [userUpload.gender]);

	const handleUploadFile = (file: File) => {
		if (uploadFaceMutation.isPending) return;
		uploadFaceMutation.mutate({ file });
	};

	const handleUpdateMe = (value: string) => {
		updateMeMutation.mutate({ gender: value });
	};

	if (userUpload?.image_url && !showSettings) {
		return <UserPhoto onChangePhoto={() => setShowSettings(true)} />;
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

					<AuthGuard onValueChange={true} onClick={false}>
						<RadioGroup
							value={selectedGender}
							onValueChange={(value: string) => {
								setSelectedGender(value);
								handleUpdateMe(value);
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
					</AuthGuard>
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
								ref={fileUploadRef}
								onUploadSuccess={handleUploadFile}
								acceptedFileTypes={["image/*"]}
								maxFileSize={10 * 1024 * 1024} // 10MB
								uploadDelay={100}
								validateFile={() => null}
								className="w-full"
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
