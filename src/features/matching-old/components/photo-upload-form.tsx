import { Card, CardContent } from "@/components/ui/card";
import { GenderSelection } from "../../matching/components/gender-selection";
import { GenerateButton } from "../../matching/components/generate-button";
import { PhotoUploadSection } from "../../matching/components/photo-upload-section";

interface PhotoUploadFormProps {
	fatherPhoto: File | null;
	motherPhoto: File | null;
	selectedGender: "boy" | "girl";
	isGenerating: boolean;
	onFatherPhotoUpload: (file: File) => void;
	onMotherPhotoUpload: (file: File) => void;
	onGenderChange: (gender: "boy" | "girl") => void;
	onGenerate: () => void;
}

export function PhotoUploadForm({
	fatherPhoto,
	motherPhoto,
	selectedGender,
	isGenerating,
	onFatherPhotoUpload,
	onMotherPhotoUpload,
	onGenderChange,
	onGenerate,
}: PhotoUploadFormProps) {
	const isGenerateDisabled = !fatherPhoto || !motherPhoto || isGenerating;

	return (
		<Card className="h-full border-0 p-0 shadow-none rounded-none grid">
			<CardContent className="p-0 flex flex-col">
				<div className="h-0 flex-grow flex flex-col justify-center min-h-[462px]">
					<PhotoUploadSection
						step={1}
						title="Your Photo"
						description="click to upload JPG or PNG images"
						variant="purple"
						onPhotoUpload={onFatherPhotoUpload}
					/>

					<img
						className="w-[360px] h-auto mx-auto"
						src="/images/match-love.png"
						alt=""
					></img>
				</div>
				<div className="sticky bottom-0 backdrop-blur-md border-t border-black/10 p-12 space-y-4">
					<GenderSelection
						selectedGender={selectedGender}
						onGenderChange={onGenderChange}
					/>

					<GenerateButton
						isGenerating={isGenerating}
						isDisabled={isGenerateDisabled}
						onGenerate={onGenerate}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
