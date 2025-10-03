import { Baby, Download, Heart, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
	const [isGenerating, setIsGenerating] = useState(false);
	const [babyImage, setBabyImage] = useState<string | null>(null);

	const generateBaby = async () => {
		if (!userPhoto || !matchPhoto) {
			toast.error("Need both photos to generate baby!");
			return;
		}

		setIsGenerating(true);

		// Simulate baby generation (in real app, this would call an AI service)
		try {
			// This would integrate with APIs like:
			// - Face++ API for face detection and facial feature extraction
			// - RunwayML or OpenAI DALL-E for AI image generation
			// - Custom ML model trained on family photos for realistic baby synthesis

			// Simulate API processing time
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// For demo, we'll generate a baby image using image generation
			// In production, this would use the parent images to create a realistic blend
			const babyImageUrl = `https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&h=400&fit=crop&crop=face&auto=format&q=80&${Date.now()}`;
			setBabyImage(babyImageUrl);
			toast.success("Baby face generated successfully! 👶✨");
		} catch (error) {
			console.error("Baby generation error:", error);
			toast.error("Failed to generate baby face. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	const shareBaby = async () => {
		if (!babyImage) return;

		const shareData = {
			title: `Our Future Baby! 👶`,
			text: `Check out what ${matchName || "my match"} and I would look like as parents! 💕`,
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
				// Fallback: Copy link to clipboard
				await navigator.clipboard.writeText(window.location.href);
				toast.success("Link copied to clipboard! Share away! 📋");
			}
		} catch (error) {
			console.error("Share failed:", error);
			// Final fallback: Copy link
			try {
				await navigator.clipboard.writeText(window.location.href);
				toast.success("Link copied to clipboard! 📋");
			} catch (_clipboardError) {
				toast.error("Unable to share. Try saving the image instead.");
			}
		}
	};

	const canGenerate = userPhoto && matchPhoto;

	return (
		<Card className="p-6 bg-gradient-card shadow-soft border-0">
			{onBack && (
				<Button variant="ghost" onClick={onBack} className="mb-4">
					← Back to Matches
				</Button>
			)}
			<div className="text-center mb-6">
				<div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
					<Baby className="w-8 h-8 text-white" />
				</div>
				<h2 className="text-2xl font-bold text-foreground mb-2">
					Baby Generator
				</h2>
				<p className="text-muted-foreground">
					{canGenerate
						? `See what you and ${matchName || "your match"} would look like as parents!`
						: "Select a match to generate your baby's face"}
				</p>
			</div>

			<div className="space-y-6">
				{/* Parent Photos Preview with Baby in Center */}
				<div className="flex items-center justify-center gap-6">
					{/* Left Parent */}
					<div className="text-center">
						<div
							className={`w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden ${
								userPhoto
									? "border-2 border-green-500"
									: "border-2 border-dashed border-gray-300 bg-gray-50"
							}`}
						>
							{userPhoto ? (
								<img
									src={userPhoto}
									alt="You"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-400">
									👤
								</div>
							)}
						</div>
						<p className="font-medium text-foreground">You</p>
						{userPhoto ? (
							<p className="text-sm text-green-600">✓ Ready</p>
						) : (
							<p className="text-sm text-gray-500">Upload needed</p>
						)}
					</div>

					{/* Baby in Center */}
					<div className="text-center flex-shrink-0">
						{babyImage ? (
							<div className="space-y-3 animate-fade-in">
								<div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-match border-4 border-white">
									<img
										src={babyImage}
										alt="Your future baby"
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="flex items-center justify-center gap-1 mb-2">
									<span className="text-lg">🎉</span>
									<p className="font-bold text-foreground text-sm">
										Your Baby!
									</p>
									<span className="text-lg">🎉</span>
								</div>
								<div className="flex gap-1 justify-center">
									<Button
										onClick={shareBaby}
										className="gap-1 text-xs bg-gradient-primary hover:opacity-90 text-white border-0"
										size="sm"
									>
										<Share2 className="w-3 h-3" />
										Share
									</Button>
									<Button variant="outline" size="sm" className="gap-1 text-xs">
										<Download className="w-3 h-3" />
										Save
									</Button>
									<Button
										onClick={() => {
											setBabyImage(null);
											generateBaby();
										}}
										variant="outline"
										size="sm"
										className="gap-1 text-xs"
									>
										<Sparkles className="w-3 h-3" />
										Retry
									</Button>
								</div>
							</div>
						) : (
							<div className="w-32 h-32 mx-auto rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
								<Baby className="w-8 h-8 text-gray-400" />
							</div>
						)}
					</div>

					{/* Right Parent */}
					<div className="text-center">
						<div
							className={`w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden ${
								matchPhoto
									? "border-2 border-green-500"
									: "border-2 border-dashed border-gray-300 bg-gray-50"
							}`}
						>
							{matchPhoto ? (
								<img
									src={matchPhoto}
									alt={matchName || "Match"}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-400">
									❤️
								</div>
							)}
						</div>
						<p className="font-medium text-foreground">
							{matchName || "Your Match"}
						</p>
						{matchPhoto ? (
							<p className="text-sm text-green-600">✓ Ready</p>
						) : (
							<p className="text-sm text-gray-500">Select a match</p>
						)}
					</div>
				</div>

				{/* Generate Button */}
				{canGenerate ? (
					<Button
						onClick={generateBaby}
						disabled={isGenerating}
						className="w-full h-14 bg-gradient-primary hover:opacity-90 border-0 text-white font-bold text-lg"
					>
						{isGenerating ? (
							<>
								<Sparkles className="w-5 h-5 mr-3 animate-spin" />
								Creating Your Baby... ✨
							</>
						) : (
							<>
								<Baby className="w-5 h-5 mr-3" />✨ Generate Our Baby's Face ✨
							</>
						)}
					</Button>
				) : (
					<div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
						<Heart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
						<p className="font-medium text-gray-600 mb-1">
							Ready to Create Magic?
						</p>
						<p className="text-sm text-gray-500">
							Select a match from your potential matches to generate your baby!
						</p>
					</div>
				)}

				{/* Help Text */}
				{!babyImage && canGenerate && (
					<div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
						<p className="text-sm text-blue-700">
							💡 <strong>Tip:</strong> Our AI will blend your facial features to
							create a realistic baby face!
						</p>
					</div>
				)}
			</div>
		</Card>
	);
};
