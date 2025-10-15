import { AnimatePresence, motion } from "framer-motion";
import { Baby, Download, Share2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { useGenerateBaby } from "../../api/generate-baby";

interface BabyGeneratorProps {
	matchId?: string;
	userPhoto?: string;
	matchPhoto?: string;
	matchName?: string;
	onBack?: () => void;
}

export const BabyGenerator = ({
	matchId,
	userPhoto,
	matchPhoto,
	matchName,
	onBack,
}: BabyGeneratorProps) => {
	const [babyImage, setBabyImage] = useState<string>("");
	const [currentStep, setCurrentStep] = useState("");
	const [completedSteps, setCompletedSteps] = useState<string[]>([]);

	const { mutate: generateBaby, isPending: isGenerating } = useGenerateBaby();

	const generationSteps = [
		{
			id: "analyze",
			label: "Analyzing",
			description: "Processing facial features",
		},
		{ id: "blend", label: "Blending", description: "Combining genetics" },
		{ id: "enhance", label: "Enhancing", description: "Adding final touches" },
		{ id: "complete", label: "Complete", description: "Your baby is ready!" },
	];

	const handleGenerate = async () => {
		if (!matchId) {
			toast.error("Match ID is required to generate baby! 📸");
			return;
		}

		setBabyImage("");
		setCurrentStep("analyze");
		setCompletedSteps([]);

		// Simulate progress steps
		const progressInterval = setInterval(() => {
			setCompletedSteps((prev) => {
				const nextIndex = prev.length;
				if (nextIndex < generationSteps.length - 1) {
					setCurrentStep(generationSteps[nextIndex + 1].id);
					return [...prev, generationSteps[nextIndex].id];
				}
				return prev;
			});
		}, 1000);

		generateBaby(matchId, {
			onSuccess: (data) => {
				clearInterval(progressInterval);
				setCompletedSteps(generationSteps.map((s) => s.id));
				setCurrentStep("complete");
				setBabyImage(data.image_url);
				toast.success("Your baby is ready! 🎉");
			},
			onError: (error: any) => {
				clearInterval(progressInterval);
				setCurrentStep("");
				setCompletedSteps([]);
				console.error("Generation failed:", error);
				const errorMessage =
					error?.response?.data?.error ||
					"Failed to generate baby. Please try again! 😔";
				toast.error(errorMessage);
			},
		});
	};

	const shareBaby = async () => {
		if (!babyImage) return;

		const shareData = {
			title: `Our Future Baby! 👶`,
			text: `${matchName || "My match"} and I would make beautiful babies! 💕 #Fuzed`,
			url: window.location.href,
		};

		try {
			if (
				navigator.share &&
				navigator.canShare &&
				navigator.canShare(shareData)
			) {
				await navigator.share(shareData);
				toast.success("Baby shared successfully! 🎉");
			} else {
				await navigator.clipboard.writeText(
					`Check out what ${matchName || "my match"} and I would look like as parents! ${window.location.href}`,
				);
				toast.success("Link copied to clipboard! Share away! 📋");
			}
		} catch (_error) {
			toast.error("Unable to share. Try saving the image instead.");
		}
	};

	const saveBaby = async () => {
		if (!babyImage) return;

		try {
			// Fetch the image as blob
			const response = await fetch(babyImage);
			const blob = await response.blob();

			// Create download link
			const link = document.createElement("a");
			link.download = `fuzed-baby-${matchName || "match"}.jpg`;
			link.href = URL.createObjectURL(blob);
			link.click();

			// Clean up
			URL.revokeObjectURL(link.href);

			toast.success("Baby image saved! 💾");
		} catch (_error) {
			toast.error("Unable to save image");
		}
	};

	const retryGeneration = () => {
		setBabyImage("");
		handleGenerate();
	};

	const canGenerate = userPhoto && matchPhoto && matchId;

	return (
		<Card className="p-6 bg-gradient-primary text-white border-0 shadow-match">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-6"
			>
				{/* Header */}
				<div className="text-center">
					<h3 className="text-xl font-semibold flex items-center justify-center gap-2">
						<Baby className="w-6 h-6" />
						Baby Generator
					</h3>
					{matchName && (
						<p className="text-white/90 text-sm mt-1">You & {matchName}</p>
					)}
				</div>

				{/* Photo Preview & Baby Result */}
				<div className="flex justify-between items-center">
					{/* User Photo */}
					<div className="text-center">
						{userPhoto ? (
							<img
								src={userPhoto}
								alt="You"
								className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
							/>
						) : (
							<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
								<span className="text-2xl">👤</span>
							</div>
						)}
						<p className="text-xs text-white/80 mt-1">You</p>
					</div>

					{/* Baby Result */}
					<div className="text-center relative">
						<AnimatePresence mode="wait">
							{babyImage ? (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0, opacity: 0 }}
									className="relative"
								>
									<img
										src={babyImage}
										alt="Your baby"
										className="w-20 h-20 rounded-full object-cover border-3 border-white shadow-lg"
									/>
								</motion.div>
							) : isGenerating ? (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
								>
									<Sparkles className="w-8 h-8 animate-spin" />
								</motion.div>
							) : (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
								>
									<span className="text-2xl">👶</span>
								</motion.div>
							)}
						</AnimatePresence>

						{babyImage && (
							<div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
								<p className="font-bold text-white text-sm">Your Baby!</p>
								<span className="text-lg">🎉</span>
							</div>
						)}
					</div>

					{/* Match Photo */}
					<div className="text-center">
						{matchPhoto ? (
							<img
								src={matchPhoto}
								alt={matchName || "Match"}
								className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
							/>
						) : (
							<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
								<span className="text-2xl">👤</span>
							</div>
						)}
						<p className="text-xs text-white/80 mt-1">{matchName || "Match"}</p>
					</div>
				</div>

				{/* Generation Progress */}
				<AnimatePresence>
					{isGenerating && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
						>
							<ProgressIndicator
								steps={generationSteps}
								currentStep={currentStep}
								completedSteps={completedSteps}
								className="bg-white/10 rounded-lg p-4"
								showLabels={false}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Action Buttons */}
				<div className="space-y-4">
					{!babyImage && !isGenerating && (
						<Button
							onClick={handleGenerate}
							disabled={!canGenerate || isGenerating}
							className="w-full bg-white text-primary hover:bg-white/90 font-semibold py-3 gap-2"
						>
							<Zap className="w-5 h-5" />
							Generate Our Baby's Face
						</Button>
					)}

					{babyImage && !isGenerating && (
						<div className="flex gap-2 justify-center">
							<Button
								onClick={shareBaby}
								className="gap-1 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
								size="sm"
							>
								<Share2 className="w-3 h-3" />
								Share
							</Button>
							<Button
								onClick={saveBaby}
								variant="outline"
								size="sm"
								className="gap-1 text-xs border-white/30 text-white hover:bg-white/10"
							>
								<Download className="w-3 h-3" />
								Save
							</Button>
							<Button
								onClick={retryGeneration}
								variant="outline"
								size="sm"
								className="gap-1 text-xs border-white/30 text-white hover:bg-white/10"
							>
								<Sparkles className="w-3 h-3" />
								Retry
							</Button>
						</div>
					)}
				</div>

				{/* Back Button */}
				{onBack && (
					<div className="text-center">
						<Button
							onClick={() => {
								onBack();
							}}
							variant="ghost"
							size="sm"
							className="text-white/80 hover:text-white hover:bg-white/10"
						>
							← Back to Matches
						</Button>
					</div>
				)}

				{!canGenerate && !isGenerating && (
					<div className="text-center text-white/70 text-sm">
						{!matchId
							? "💡 Match information required to generate baby"
							: "💡 Upload both photos to generate your baby"}
					</div>
				)}
			</motion.div>
		</Card>
	);
};
