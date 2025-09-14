import { LiveMatching } from "./live-matching";
import { PhotoUploadForm } from "./photo-upload-form";
import { VisualGenerationFlow } from "./visual-generation-flow";

interface AIBabyGeneratorProps {
	fatherPhoto: File | null;
	motherPhoto: File | null;
	selectedGender: "boy" | "girl";
	isGenerating: boolean;
	onFatherPhotoUpload: (file: File) => void;
	onMotherPhotoUpload: (file: File) => void;
	onGenderChange: (gender: "boy" | "girl") => void;
	onGenerate: () => void;
}

export function AIBabyGenerator({
	fatherPhoto,
	motherPhoto,
	selectedGender,
	isGenerating,
	onFatherPhotoUpload,
	onMotherPhotoUpload,
	onGenderChange,
	onGenerate,
}: AIBabyGeneratorProps) {
	return (
		<div className="grid lg:grid-cols-[1fr_564px] items-center h-full">
			{/* Left Section - Visual Demo */}
			<LiveMatching />

			{/* Right Section - Input Form */}
			<PhotoUploadForm
				fatherPhoto={fatherPhoto}
				motherPhoto={motherPhoto}
				selectedGender={selectedGender}
				isGenerating={isGenerating}
				onFatherPhotoUpload={onFatherPhotoUpload}
				onMotherPhotoUpload={onMotherPhotoUpload}
				onGenderChange={onGenderChange}
				onGenerate={onGenerate}
			/>
		</div>
	);
}
