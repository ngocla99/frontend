"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Baby,
	Download,
	Heart,
	MessageCircle,
	Share2,
	Sparkles,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BlurImage } from "@/components/blur-image";
import SiriOrb from "@/components/smoothui/siri-orb";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateBaby } from "../../api/generate-baby";
import { useBabyForMatch } from "../../api/get-baby";
import type { MatchMode } from "../../store/user-matches";

interface BabyGeneratorProps {
	matchId?: string;
	userPhoto?: string;
	matchPhoto?: string;
	userName?: string;
	matchName?: string;
	mode?: MatchMode;
	onBack?: () => void;
}

export const BabyGenerator = ({
	matchId,
	userPhoto,
	matchPhoto,
	userName,
	matchName,
	mode = "own-match",
	onBack,
}: BabyGeneratorProps) => {
	const router = useRouter();
	const [babyImage, setBabyImage] = useState<string>("");
	const [mutualConnection, setMutualConnection] = useState<{
		id: string;
		icebreaker: string;
	} | null>(null);
	const [showMutualDialog, setShowMutualDialog] = useState(false);
	const isLiveMatch = mode === "live-match";

	const generateBabyMutation = useGenerateBaby({
		mutationConfig: {
			onSuccess: (data) => {
				if (!data?.image_url) {
					toast.error("Failed to generate baby image. Please try again! 😔");
					return;
				}
				setBabyImage(data.image_url);

				// Check if mutual connection was created
				if (data.mutual_connection) {
					setMutualConnection(data.mutual_connection);
					setShowMutualDialog(true);
					toast.success("It's a match! Chat unlocked! 💬");
				} else {
					toast.success("Baby generated! Notification sent. 👶");
				}
			},
		},
	});

	// Fetch existing baby for this match
	const { data: existingBaby, isLoading: loadingExisting } = useBabyForMatch({
		matchId,
		queryConfig: {
			enabled: !!matchId,
		},
	});

	// Load existing baby image when available
	useEffect(() => {
		if (existingBaby?.image_url) {
			setBabyImage(existingBaby.image_url);
		}
	}, [existingBaby]);

	const handleGenerate = async () => {
		if (generateBabyMutation.isPending) return;
		if (!matchId) {
			toast.error("Match ID is required to generate baby! 📸");
			return;
		}

		setBabyImage("");
		generateBabyMutation.mutate(matchId);
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

	// const retryGeneration = () => {
	// 	setBabyImage("");
	// 	handleGenerate();
	// };

	const canGenerate = userPhoto && matchPhoto && matchId;

	return (
		<div className="w-full p-6 md:p-8 text-white">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-8"
			>
				{/* Header */}
				<div className="text-center">
					<h3 className="text-xl font-semibold flex items-center justify-center gap-2">
						<Baby className="w-6 h-6" />
						{isLiveMatch ? "Baby Preview" : "Baby Generator"}
					</h3>
					{isLiveMatch && userName && matchName ? (
						<p className="text-white/90 text-sm mt-1">
							{userName} & {matchName}
						</p>
					) : (
						matchName && (
							<p className="text-white/90 text-sm mt-1">You & {matchName}</p>
						)
					)}
				</div>

				{/* Baby Result - Prominent Center Position */}
				<div className="flex justify-center items-center gap-6">
					{/* Baby Circle */}
					<div className="text-center relative">
						<AnimatePresence mode="wait">
							{babyImage ? (
								<motion.div
									initial={{ scale: 0, rotate: -180, opacity: 0 }}
									animate={{ scale: 1, rotate: 0, opacity: 1 }}
									transition={{
										type: "spring",
										stiffness: 260,
										damping: 20,
										duration: 0.6,
									}}
									className="relative"
								>
									{/* Sparkle burst effect */}
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
										transition={{ duration: 0.8 }}
										className="absolute inset-0 flex items-center justify-center text-4xl"
									>
										✨
									</motion.div>

									{/* Baby image with glow */}
									<div className="relative">
										<div className="absolute -inset-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-lg opacity-60" />
										<BlurImage
											src={babyImage}
											alt="Your baby"
											width={112}
											height={112}
											className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-2xl"
										/>
									</div>

									{/* Success label */}
									<div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
										<p className="font-bold text-white text-sm whitespace-nowrap">
											{isLiveMatch ? "Their Baby!" : "Your Baby!"}
										</p>
									</div>
								</motion.div>
							) : generateBabyMutation.isPending || loadingExisting ? (
								<SiriOrb size="96px" animationDuration={5} />
							) : (
								<div className="relative w-24 h-24 md:w-28 md:h-28">
									{/* Animated glow ring */}
									<motion.div
										className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/30 to-purple-400/30 blur-xl"
										animate={{
											scale: [1, 1.2, 1],
											opacity: [0.5, 0.8, 0.5],
										}}
										transition={{
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
										}}
									/>
									{/* Question mark with shimmer */}
									<div className="relative w-full h-full rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center">
										<span className="text-4xl md:text-5xl">❓</span>
									</div>
									<div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white/90 text-xs text-center whitespace-nowrap">
										{isLiveMatch ? "No baby yet" : "Generate to see!"}
									</div>
								</div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Photo Preview Row */}
				<div className="flex justify-center items-center gap-6">
					{/* User Photo */}
					<motion.div
						whileHover={{ scale: 1.1, y: -4 }}
						transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
						className="text-center relative group/avatar cursor-pointer"
					>
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-[2px] opacity-60 group-hover/avatar:opacity-100 transition-opacity duration-200" />
							{userPhoto ? (
								<BlurImage
									src={userPhoto}
									alt="You"
									width={80}
									height={80}
									className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-white shadow-lg"
								/>
							) : (
								<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center border-3 border-white shadow-lg">
									<span className="text-3xl">👤</span>
								</div>
							)}
						</div>
						<p className="text-xs text-white/80 mt-2 font-medium">
							{isLiveMatch && userName ? userName : "You"}
						</p>
					</motion.div>

					{/* Heart Connector */}
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.6, 1, 0.6],
						}}
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
						}}
					>
						<Heart className="w-6 h-6 text-white/80 fill-white/30" />
					</motion.div>

					{/* Match Photo */}
					<motion.div
						whileHover={{ scale: 1.1, y: -4 }}
						transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
						className="text-center relative group/avatar cursor-pointer"
					>
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-[2px] opacity-60 group-hover/avatar:opacity-100 transition-opacity duration-200" />
							{matchPhoto ? (
								<BlurImage
									src={matchPhoto}
									alt={matchName || "Match"}
									width={80}
									height={80}
									className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-3 border-white shadow-lg"
								/>
							) : (
								<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center border-3 border-white shadow-lg">
									<span className="text-3xl">👤</span>
								</div>
							)}
						</div>
						<p className="text-xs text-white/80 mt-2 font-medium">
							{matchName || "Match"}
						</p>
					</motion.div>
				</div>

				{/* Primary Action Button - Centered & Prominent */}
				{!babyImage && !generateBabyMutation.isPending && !isLiveMatch && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex justify-center"
					>
						<Button
							onClick={handleGenerate}
							disabled={!canGenerate || generateBabyMutation.isPending}
							size="lg"
							className="bg-white text-primary hover:bg-white/95 font-bold py-4 px-6 md:px-8 gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 relative group text-sm md:text-base"
						>
							<motion.div
								animate={{ scale: [1, 1.2, 1] }}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
								}}
							>
								<Zap className="w-5 h-5 group-hover:text-yellow-500 transition-colors" />
							</motion.div>
							<span>Generate Our Baby's Face</span>

							{/* Pulse effect */}
							<motion.div
								className="absolute inset-0 rounded-md bg-white/20"
								animate={{
									scale: [1, 1.05, 1],
									opacity: [0, 0.5, 0],
								}}
								transition={{
									duration: 2,
									repeat: Number.POSITIVE_INFINITY,
								}}
							/>
						</Button>
					</motion.div>
				)}

				{/* Secondary Actions - Grouped Pills */}
				{babyImage && !generateBabyMutation.isPending && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex justify-center gap-2"
					>
						<div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5">
							<Button
								onClick={shareBaby}
								variant="ghost"
								size="sm"
								className="gap-2 px-4 py-2 hover:bg-white/30 text-white rounded-full transition-all"
							>
								<Share2 className="w-4 h-4" />
								<span className="font-medium">Share</span>
							</Button>

							<div className="w-px h-6 bg-white/30" />

							<Button
								onClick={saveBaby}
								variant="ghost"
								size="sm"
								className="gap-2 px-4 py-2 hover:bg-white/30 text-white rounded-full transition-all"
							>
								<Download className="w-4 h-4" />
								<span className="font-medium">Save</span>
							</Button>

							{/* {!isLiveMatch && (
								<>
									<div className="w-px h-6 bg-white/30" />

									<Button
										onClick={retryGeneration}
										variant="ghost"
										size="sm"
										className="gap-2 px-4 py-2 hover:bg-white/30 text-white rounded-full transition-all"
									>
										<Sparkles className="w-4 h-4" />
										<span className="font-medium">Retry</span>
									</Button>
								</>
							)} */}
						</div>
					</motion.div>
				)}

				{/* Helper Text */}
				{!canGenerate &&
					!generateBabyMutation.isPending &&
					!loadingExisting && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center text-white/70 text-sm"
						>
							{!matchId
								? "💡 Match information required to generate baby"
								: "💡 Upload both photos to generate your baby"}
						</motion.div>
					)}

				{/* Back Button - Visually Separated */}
				{onBack && (
					<div className="relative pt-4 hidden md:block">
						<div className="w-full h-px bg-white/20 mb-4" />
						<div className="text-center">
							<Button
								onClick={() => {
									onBack();
								}}
								variant="ghost"
								size="sm"
								className="text-white/80 hover:text-white hover:bg-white/10 gap-2 transition-all"
							>
								← Back to Matches
							</Button>
						</div>
					</div>
				)}
			</motion.div>

			{/* Mutual Connection Celebration Dialog */}
			<Dialog open={showMutualDialog} onOpenChange={setShowMutualDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center text-2xl">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 200 }}
								className="flex flex-col items-center gap-2"
							>
								<Heart className="w-12 h-12 text-red-500 fill-red-500" />
								<span>It's a Match!</span>
							</motion.div>
						</DialogTitle>
						<DialogDescription className="text-center space-y-4 pt-4">
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className="text-base"
							>
								You both generated a baby together! 🎉
							</motion.p>
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-sm text-muted-foreground"
							>
								Chat is now unlocked. Start your conversation!
							</motion.p>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex flex-col gap-2 sm:flex-col">
						<Button
							onClick={() => {
								if (mutualConnection?.id) {
									router.push(`/chat/${mutualConnection.id}`);
								}
							}}
							className="w-full"
							size="lg"
						>
							<MessageCircle className="w-4 h-4 mr-2" />
							Start Chatting
						</Button>
						<Button
							variant="outline"
							onClick={() => setShowMutualDialog(false)}
							className="w-full"
						>
							Maybe Later
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
