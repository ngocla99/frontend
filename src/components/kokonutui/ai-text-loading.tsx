/**
 * @author: @kokonutui
 * @description: AI Text Loading
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AITextLoadingProps {
	texts?: string[];
	className?: string;
	interval?: number;
}

export default function AITextLoading({
	texts = [
		"Thinking...",
		"Processing...",
		"Analyzing...",
		"Computing...",
		"Almost...",
	],
	className,
	interval = 1500,
}: AITextLoadingProps) {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
		}, interval);

		return () => clearInterval(timer);
	}, [interval, texts.length]);

	return (
		<div className="flex items-center justify-center p-8">
			<motion.div
				className="relative px-4 py-2 w-full"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: 0.4,
					ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
				}}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={currentTextIndex}
						initial={{ opacity: 0, y: 20 }}
						animate={{
							opacity: 1,
							y: 0,
							backgroundPosition: ["200% center", "-200% center"],
						}}
						exit={{ opacity: 0, y: -20 }}
						transition={{
							opacity: {
								duration: 0.3,
								ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
							},
							y: {
								duration: 0.3,
								ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
							},
							backgroundPosition: {
								duration: 2.5,
								ease: "linear",
								repeat: Infinity,
							},
						}}
						className={cn(
							"flex justify-center text-3xl font-bold font-[Poppins] bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 dark:from-pink-400 dark:via-rose-400 dark:to-pink-400 bg-[length:200%_100%] bg-clip-text text-transparent whitespace-nowrap min-w-max",
							className,
						)}
					>
						{texts[currentTextIndex]}
					</motion.div>
				</AnimatePresence>
			</motion.div>
		</div>
	);
}
