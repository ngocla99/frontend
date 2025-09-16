/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { AnimatePresence, motion } from "framer-motion";
import { Baby, Download, Share2, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { storage } from "@/old/lib/storage";

interface BabyGeneratorProps {
	userPhoto?: string;
	matchPhoto?: string;
	matchName?: string;
	onBack?: () => void;
}

export const BabyGenerator = ({
	userPhoto,
	matchPhoto,
	matchName,
	onBack,
}: BabyGeneratorProps) => {
	const [babyImage, setBabyImage] = useState<string>("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentStep, setCurrentStep] = useState("");
	const [completedSteps, setCompletedSteps] = useState<string[]>([]);
	const [compatibilityScore, setCompatibilityScore] = useState<number>(0);
	const [predictions, setPredictions] = useState<{
		eyes: string;
		hair: string;
		personality: string[];
	} | null>(null);

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

	const generateBaby = async () => {
		if (!userPhoto || !matchPhoto) {
			toast.error("Please upload both photos first! 📸");
			return;
		}

		setIsGenerating(true);
		setBabyImage("");
		setCurrentStep("analyze");
		setCompletedSteps([]);

		try {
			// Enhanced generation process with realistic steps
			for (let i = 0; i < generationSteps.length; i++) {
				const step = generationSteps[i];
				setCurrentStep(step.id);

				// Simulate realistic processing time
				const processingTime = step.id === "blend" ? 2000 : 1000;
				await new Promise((resolve) => setTimeout(resolve, processingTime));

				setCompletedSteps((prev) => [...prev, step.id]);

				if (i < generationSteps.length - 1) {
				}
			}

			// Generate compatibility score
			const score = Math.floor(Math.random() * 30) + 70; // 70-99%
			setCompatibilityScore(score);

			// Generate predictions
			const eyeColors = ["Brown", "Blue", "Green", "Hazel"];
			const hairColors = ["Brown", "Blonde", "Black", "Auburn"];
			const personalities = [
				["Creative", "Artistic", "Imaginative"],
				["Intelligent", "Curious", "Analytical"],
				["Outgoing", "Social", "Charismatic"],
				["Gentle", "Caring", "Empathetic"],
				["Adventurous", "Bold", "Energetic"],
			];

			setPredictions({
				eyes: eyeColors[Math.floor(Math.random() * eyeColors.length)],
				hair: hairColors[Math.floor(Math.random() * hairColors.length)],
				personality:
					personalities[Math.floor(Math.random() * personalities.length)],
			});

			// Create a placeholder baby image (in production, this would be AI-generated)
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = 200;
			canvas.height = 200;

			if (ctx) {
				// Create a simple baby face placeholder
				const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
				gradient.addColorStop(0, "#fef3c7");
				gradient.addColorStop(1, "#f59e0b");

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(100, 100, 80, 0, Math.PI * 2);
				ctx.fill();

				// Add simple features
				ctx.fillStyle = "#374151";
				ctx.beginPath();
				ctx.arc(85, 85, 8, 0, Math.PI * 2);
				ctx.arc(115, 85, 8, 0, Math.PI * 2);
				ctx.fill();

				// Smile
				ctx.strokeStyle = "#374151";
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(100, 105, 15, 0, Math.PI);
				ctx.stroke();

				setBabyImage(canvas.toDataURL());
			}

			// Save to history
			if (userPhoto && matchPhoto && matchName) {
				storage.addGeneratedBaby({
					userPhoto,
					matchPhoto,
					matchName,
					babyImage: canvas.toDataURL(),
					matchType: "university", // This should be passed as a prop
				});
			}

			// Track generation
			storage.trackEvent("baby_generated", {
				matchName,
				compatibilityScore: score,
				hasUserPhoto: !!userPhoto,
				hasMatchPhoto: !!matchPhoto,
			});

			toast.success(`Your baby is ready! ${score}% compatibility! 🎉`);
		} catch (error) {
			console.error("Generation failed:", error);
			toast.error("Something went wrong. Please try again! 😔");
		} finally {
			setIsGenerating(false);
		}
	};

	const shareBaby = async () => {
		if (!babyImage) return;

		const shareData = {
			title: `Our Future Baby! 👶`,
			text: `${matchName || "My match"} and I would make beautiful babies! ${compatibilityScore}% compatibility! 💕 #Fuzed`,
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
				storage.trackEvent("baby_shared", { method: "native", matchName });
			} else {
				await navigator.clipboard.writeText(
					`Check out what ${matchName || "my match"} and I would look like as parents! ${compatibilityScore}% compatibility! ${window.location.href}`,
				);
				toast.success("Link copied to clipboard! Share away! 📋");
				storage.trackEvent("baby_shared", { method: "clipboard", matchName });
			}
		} catch (error) {
			toast.error("Unable to share. Try saving the image instead.");
		}
	};

	const saveBaby = async () => {
		if (!babyImage) return;

		try {
			// Create download link
			const link = document.createElement("a");
			link.download = `fuzed-baby-${matchName || "match"}.png`;
			link.href = babyImage;
			link.click();

			toast.success("Baby image saved! 💾");
			storage.trackEvent("baby_saved", { matchName });
		} catch (error) {
			toast.error("Unable to save image");
		}
	};

	const retryGeneration = () => {
		setBabyImage("");
		setPredictions(null);
		setCompatibilityScore(0);
		generateBaby();
	};

	const canGenerate = userPhoto && matchPhoto;

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
									{compatibilityScore > 0 && (
										<Badge className="absolute -top-2 -right-2 bg-white text-primary px-2 py-1">
											<Trophy className="w-3 h-3 mr-1" />
											{compatibilityScore}%
										</Badge>
									)}
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

				{/* Predictions */}
				<AnimatePresence>
					{predictions && babyImage && !isGenerating && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white/10 rounded-lg p-4 space-y-3"
						>
							<h4 className="font-semibold text-center">Baby Predictions</h4>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="text-center">
									<p className="text-white/80">Eyes</p>
									<p className="font-medium">{predictions.eyes}</p>
								</div>
								<div className="text-center">
									<p className="text-white/80">Hair</p>
									<p className="font-medium">{predictions.hair}</p>
								</div>
							</div>
							<div className="text-center">
								<p className="text-white/80 text-sm">Personality Traits</p>
								<div className="flex gap-1 justify-center mt-1">
									{predictions.personality.map((trait, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="text-xs bg-white/20 text-white"
										>
											{trait}
										</Badge>
									))}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Action Buttons */}
				<div className="space-y-4">
					{!babyImage && !isGenerating && (
						<Button
							onClick={generateBaby}
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
						💡 Upload both photos to generate your baby
					</div>
				)}
			</motion.div>
		</Card>
	);
};
