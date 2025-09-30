import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import React from "react";
import { ImageLoader } from "@/components/image-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useReactToMatch } from "@/features/matching/api/react-to-match";
import type { UniversityMatch } from "./university-match-tab";

interface UniversityMatchCardProps {
	match: UniversityMatch;
	isSelected: boolean;
	setSelectedMatch: any;
}

export function UniversityMatchCard({
	match,
	isSelected,
	setSelectedMatch,
}: UniversityMatchCardProps) {
	const { mutate: reactToMatch } = useReactToMatch();
	const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

	const isMultiplePhotos = match?.numberOfMatches > 1;

	const handleFavoriteToggle = (
		match: UniversityMatch,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		reactToMatch({ matchId: match.id, favorite: !match.isFavorited });
	};

	return (
		<div
			key={match.id}
			className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer hover:shadow-lg relative ${
				isSelected
					? "border-pink-300 bg-pink-50 shadow-md"
					: "border-gray-200 bg-white hover:border-pink-200 hover:bg-pink-25"
			}`}
		>
			{/* Favorite Button */}
			<motion.button
				className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-all duration-200"
				onClick={(e) => handleFavoriteToggle(match, e)}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				initial={false}
				animate={{
					scale: match.isFavorited ? [1, 1.2, 1] : 1,
				}}
				transition={{
					duration: 0.3,
					ease: "easeOut",
				}}
			>
				<motion.div
					animate={{
						scale: match.isFavorited ? 1.1 : 1,
						rotate: match.isFavorited ? [0, -10, 10, 0] : 0,
					}}
					transition={{
						duration: match.isFavorited ? 0.6 : 0.2,
						ease: "easeOut",
					}}
				>
					<Heart
						className={`w-4 h-4 transition-colors duration-200 ${
							match.isFavorited
								? "text-pink-500 fill-pink-500"
								: "text-gray-400 hover:text-pink-400"
						}`}
					/>
				</motion.div>
			</motion.button>

			{/* Main content with left-center-right layout */}
			<div className="flex items-center justify-between mb-4">
				{/* Current User (Me) */}
				<div className="flex flex-col items-center gap-2">
					<div className="relative group/avatar">
						<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-[2px]" />
						<ImageLoader
							src={match.me.image}
							alt={match.me.name}
							width={56}
							height={56}
							className="relative w-14 h-14 rounded-full border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
						/>
					</div>
					<div className="text-center">
						<p className="text-xs font-semibold text-gray-800 group-hover:text-pink-600 transition-colors duration-300 truncate max-w-[60px]">
							{match.me.name}
						</p>
						<p className="text-xs text-gray-500">{match.me.school}</p>
					</div>
				</div>

				{/* Match Info Center */}
				<div className="flex flex-col items-center gap-1 px-3">
					{/* Heart Icon */}
					<div className="relative">
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-[4px]"
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.3, 0.6, 0.3],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						/>
						<motion.div
							animate={{
								scale: [1, 1.1, 1],
								rotate: [0, 10, -10, 0],
							}}
							transition={{
								duration: 3,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							<Heart className="relative w-6 h-6 text-pink-500" />
						</motion.div>
					</div>

					{/* Match Percentage */}
					<div className="text-center">
						<div className="flex items-center gap-1 mb-1">
							<motion.span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
								{match.matchPercentage}%
							</motion.span>
						</div>
						<div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
							MATCH
						</div>
					</div>

					{/* Match Count Badge */}
					{isMultiplePhotos && (
						<div className="flex items-center justify-center gap-2 mt-2">
							<motion.div
								animate={{
									scale: [1, 1.05, 1],
									y: [0, -2, 0],
								}}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							>
								<Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md text-xs px-2 py-1">
									{match.numberOfMatches} matches
								</Badge>
							</motion.div>
						</div>
					)}
				</div>

				{/* Other User (Matched Person) */}
				<div className="flex flex-col items-center gap-2">
					<div className="relative group/avatar">
						<div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-[2px]" />
						<ImageLoader
							src={match.other.image}
							alt={match.other.name}
							width={56}
							height={56}
							className="relative w-14 h-14 rounded-full border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
						/>
					</div>
					<div className="text-center">
						<p className="text-xs font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-300 truncate max-w-[60px]">
							{match.other.name}
						</p>
						<p className="text-xs text-gray-500">{match.other.school}</p>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3 text-xs text-gray-500">
					<div className="flex items-center gap-1">
						<span className="font-medium">{match.timestamp}</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Expand/Collapse Button */}
					{isMultiplePhotos && (
						<Collapsible
							open={isExpanded}
							onOpenChange={setIsExpanded}
							className="size-6"
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="p-1 h-6 w-6 hover:bg-accent hover:text-foreground rounded-full"
								>
									{isExpanded ? (
										<ChevronUp className="w-3 h-3" />
									) : (
										<ChevronDown className="w-3 h-3" />
									)}
								</Button>
							</CollapsibleTrigger>
						</Collapsible>
					)}

					{/* View Match Button */}
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
						<Button
							variant="ghost"
							size="sm"
							className="group/btn flex items-center gap-1.5 hover:bg-gradient-to-r hover:from-pink-600 hover:to-rose-600 rounded-full px-4 py-1.5 transition-all duration-300 text-xs hover:text-white"
							onClick={() => setSelectedMatch(match)}
						>
							<span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent group-hover/btn:text-white">
								View Baby
							</span>
						</Button>
					</motion.div>
				</div>
			</div>
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<CollapsibleContent>
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="mt-4 space-y-3"
					>
						<Separator />
						<div className="space-y-2">
							<h4 className="text-sm font-semibold text-foreground mb-2">
								Match History
							</h4>

							{match.matches.map((individualMatch, index) => (
								<motion.div
									key={individualMatch.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.1 }}
									className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
								>
									<div className="flex items-center gap-3">
										<ImageLoader
											src={individualMatch.image}
											alt={`Match ${index + 1}`}
											width={32}
											height={32}
											className="w-8 h-8 rounded-full border border-muted-foreground/20"
										/>
										<div>
											<p className="text-sm font-medium">
												{individualMatch.matchPercentage}% match
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(
													individualMatch.createdAt,
												).toLocaleDateString()}{" "}
												at{" "}
												{new Date(individualMatch.createdAt).toLocaleTimeString(
													[],
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</p>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
