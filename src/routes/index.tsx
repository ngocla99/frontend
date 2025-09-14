import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AIBabyGenerator } from "@/features/matching/components";
import user1Image from "@/old/assets/user1.jpg";
import user2Image from "@/old/assets/user2.jpg";
import user3Image from "@/old/assets/user3.jpg";
import user4Image from "@/old/assets/user4.jpg";
import { LiveMatches } from "@/old/components/LiveMatches";
import { MatchCard } from "@/old/components/MatchCard";
import Index from "@/old/pages/Index";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const [fatherPhoto, setFatherPhoto] = useState<File | null>(null);
	const [motherPhoto, setMotherPhoto] = useState<File | null>(null);
	const [selectedGender, setSelectedGender] = useState<"boy" | "girl">("boy");
	const [isGenerating, setIsGenerating] = useState(false);
	const [displayedMatches, setDisplayedMatches] = useState(5);

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
			<Index />
		</div>
	);
}
