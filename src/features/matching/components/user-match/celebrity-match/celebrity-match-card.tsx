/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <no need check> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <no need check> */

import { Heart, Sparkles } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import type { CelebMatch } from "@/features/matching/utils/transform-api-data";
import { cn } from "@/lib/utils";

interface CelebrityMatchCardProps {
	celebMatch: CelebMatch;
	isSelected: boolean;
	onSelect: (celebMatch: CelebMatch) => void;
}

export const CelebrityMatchCard = ({
	celebMatch,
	isSelected,
	onSelect,
}: CelebrityMatchCardProps) => {
	return (
		<div
			className={cn(
				"group relative w-full p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ease-out cursor-pointer",
				"hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
				isSelected
					? "border-pink-400 bg-gradient-to-br from-pink-50 to-white shadow-lg ring-2 ring-pink-200 ring-offset-2"
					: "border-gray-200 bg-white hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-25 hover:to-white",
			)}
			// onClick={() => onSelect(celebMatch)}
		>
			{/* Selection indicator */}
			{isSelected && (
				<div className="absolute -top-2 -right-2 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full p-2 shadow-lg">
					<Sparkles className="w-4 h-4" />
				</div>
			)}

			<div className="flex items-center gap-3 sm:gap-4">
				{/* Celebrity Image */}
				<div className="relative flex-shrink-0">
					<BlurImage
						src={celebMatch.celeb.image}
						alt={celebMatch.celeb.name}
						width={80}
						height={80}
						className={cn(
							"w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-lg transition-all duration-300",
							isSelected
								? "border-pink-400 ring-4 ring-pink-200"
								: "border-white group-hover:border-pink-200",
						)}
					/>
				</div>

				{/* Celebrity Info */}
				<div className="flex-1 min-w-0">
					<div className="mb-1">
						<h3 className="font-bold text-foreground text-base sm:text-lg truncate mb-0.5">
							{celebMatch.celeb.name}
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
							{celebMatch.celeb.category} • {celebMatch.timestamp}
						</p>
					</div>
				</div>

				{/* Match Percentage - Right Side */}
				<div className="flex flex-col items-center gap-1 flex-shrink-0">
					<Heart
						className={cn(
							"w-5 h-5 transition-colors duration-300",
							isSelected
								? "text-pink-500 fill-pink-500"
								: "text-pink-400 fill-pink-400",
						)}
					/>
					<span
						className={cn(
							"text-lg font-bold transition-colors duration-300",
							isSelected
								? "bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
								: "text-pink-600",
						)}
					>
						{celebMatch.matchPercentage}%
					</span>
				</div>
			</div>

			{/* Hover effect overlay */}
			<div
				className={cn(
					"absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
					isSelected
						? "bg-gradient-to-br from-pink-500/5 to-transparent opacity-100"
						: "opacity-0 group-hover:opacity-100 bg-gradient-to-br from-pink-500/3 to-transparent",
				)}
			/>
		</div>
	);
};
