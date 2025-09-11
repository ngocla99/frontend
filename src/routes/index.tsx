import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AIBabyGenerator } from "@/features/matching/components";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const [fatherPhoto, setFatherPhoto] = useState<File | null>(null);
	const [motherPhoto, setMotherPhoto] = useState<File | null>(null);
	const [selectedGender, setSelectedGender] = useState<"boy" | "girl">("boy");
	const [isGenerating, setIsGenerating] = useState(false);

	const handleFatherPhotoUpload = (file: File) => {
		setFatherPhoto(file);
	};

	const handleMotherPhotoUpload = (file: File) => {
		setMotherPhoto(file);
	};

	const handleGenderChange = (gender: "boy" | "girl") => {
		setSelectedGender(gender);
	};

	const handleGenerate = async () => {
		if (!fatherPhoto || !motherPhoto) return;

		setIsGenerating(true);
		// Simulate AI generation process
		setTimeout(() => {
			setIsGenerating(false);
		}, 3000);
	};

	return (
		<div className="pt-16 min-h-screen grid overflow-hidden">
			<AIBabyGenerator
				fatherPhoto={fatherPhoto}
				motherPhoto={motherPhoto}
				selectedGender={selectedGender}
				isGenerating={isGenerating}
				onFatherPhotoUpload={handleFatherPhotoUpload}
				onMotherPhotoUpload={handleMotherPhotoUpload}
				onGenderChange={handleGenderChange}
				onGenerate={handleGenerate}
			/>
		</div>
	);
}
