import { motion } from "framer-motion";
import { Clock, Heart, Sparkles, Zap } from "lucide-react";
import React from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserMatchesActions } from "../../store/user-matches";

export interface MatchCardProps {
	data: {
		user1: {
			name: string;
			image: string;
		};
		user2: {
			name: string;
			image: string;
		};
		matchPercentage: number;
		timestamp: string;
		isNew?: boolean;
		isViewed?: boolean;
	};
	isNewlyAdded?: boolean;
}

// Helper component for name with tooltip
const NameWithTooltip = ({
	name,
	className,
}: {
	name: string;
	className: string;
}) => {
	const MAX_LENGTH = 8; // Adjust this value as needed
	const shouldTruncate = name.length > MAX_LENGTH;
	const displayName = shouldTruncate
		? `${name.substring(0, MAX_LENGTH)}...`
		: name;

	if (shouldTruncate) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className={className}>{displayName}</span>
				</TooltipTrigger>
				<TooltipContent>
					<p>{name}</p>
				</TooltipContent>
			</Tooltip>
		);
	}

	return <span className={className}>{name}</span>;
};

export const MatchCard = ({ data, isNewlyAdded = false }: MatchCardProps) => {
	const { user1, user2, matchPercentage, timestamp, isNew, isViewed } = data;
	const { onOpen } = useUserMatchesActions();

	const motionConfig = React.useMemo(() => {
		if (isNewlyAdded) {
			return {
				initial: {
					opacity: 0,
					y: -20,
					scale: 0.9,
					filter: "blur(4px)",
				},
				animate: {
					opacity: 1,
					y: 0,
					scale: 1,
					filter: "blur(0px)",
				},
				transition: {
					duration: 0.8,
					type: "spring" as const,
					stiffness: 200,
					damping: 25,
					mass: 1,
					// Stagger different properties for smoother effect
					opacity: { duration: 0.4, ease: "easeOut" },
					y: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
					scale: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
					filter: { duration: 0.5, ease: "easeOut", delay: 0.1 },
				},
			};
		}

		return {
			initial: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
			transition: {
				duration: 0.3,
				type: "spring" as const,
				stiffness: 400,
				damping: 35,
			},
		};
	}, [isNewlyAdded]);

	return (
		<motion.div
			initial={motionConfig.initial}
			animate={motionConfig.animate}
			transition={motionConfig.transition}
			whileHover={
				isNewlyAdded
					? {}
					: {
							scale: 1.02,
							y: -4,
							transition: { duration: 0.2, ease: "easeOut" },
						}
			}
			whileTap={isNewlyAdded ? {} : { scale: 0.98 }}
		>
			<Card className="p-4 bg-gradient-card gap-0 shadow-soft border-0 hover:shadow-match transition-all duration-300">
				<div className="relative">
					{/* Main content */}
					<div className="flex items-center justify-between mb-4">
						{/* User 1 */}
						<div className="flex flex-col items-center gap-2">
							<div className="relative group/avatar">
								<div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-[2px]" />
								<img
									src={user1.image}
									alt={user1.name}
									className="relative w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
								/>
								{/* <motion.div
									className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-md"
									animate={{
										scale: [1, 1.1, 1],
										rotate: [0, 5, -5, 0],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								>
									<Heart className="w-2.5 h-2.5 text-white fill-white" />
								</motion.div> */}
							</div>
							<NameWithTooltip
								name={user1.name}
								className="text-xs font-semibold text-gray-800 group-hover:text-pink-600 transition-colors duration-300"
							/>
						</div>

						{/* Match percentage */}
						<div className="flex flex-col items-center gap-1 px-3">
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
							<div className="text-center">
								<motion.span
									className="text-2xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent"
									animate={
										isNewlyAdded
											? {
													scale: [1, 1.2, 1],
													textShadow: [
														"0 0 0px rgba(236, 72, 153, 0)",
														"0 0 20px rgba(236, 72, 153, 0.5)",
														"0 0 0px rgba(236, 72, 153, 0)",
													],
												}
											: {}
									}
									transition={{
										duration: 0.6,
										ease: "easeOut",
									}}
								>
									{matchPercentage}%
								</motion.span>
								<div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
									MATCH
								</div>
							</div>
						</div>

						{/* User 2 */}
						<div className="flex flex-col items-center gap-2">
							<div className="relative group/avatar">
								<div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-[2px]" />
								<img
									src={user2.image}
									alt={user2.name}
									className="relative w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg group-hover/avatar:scale-110 transition-transform duration-300"
								/>
								{/* <motion.div
									className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md"
									animate={{
										scale: [1, 1.1, 1],
										rotate: [0, -5, 5, 0],
									}}
									transition={{
										duration: 2.5,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								>
									<Heart className="w-2.5 h-2.5 text-white fill-white" />
								</motion.div> */}
							</div>
							<NameWithTooltip
								name={user2.name}
								className="text-xs font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-300"
							/>
						</div>

						<div className="flex items-center mb-7">
							{isNew && (
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
									<Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md text-xs px-2 py-1">
										<motion.div
											animate={{ rotate: 360 }}
											transition={{
												duration: 2,
												repeat: Infinity,
												ease: "linear",
											}}
										>
											<Sparkles className="w-3 h-3 mr-1" />
										</motion.div>
										NEW
									</Badge>
								</motion.div>
							)}
							{isViewed && (
								<Badge
									variant="secondary"
									className="bg-gray-100 text-gray-600 border-0 text-xs px-2 py-1"
								>
									VIEWED
								</Badge>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5 text-xs text-gray-500">
							<Clock className="w-3.5 h-3.5" />
							<span className="font-medium">{timestamp}</span>
						</div>

						<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<AuthGuard>
								<Button
									variant="ghost"
									size="sm"
									className="group/btn flex items-center gap-1.5 hover:bg-gradient-to-r hover:from-pink-600 hover:to-rose-600 rounded-full px-4 py-1.5 transition-all duration-300 text-xs hover:text-white"
									onClick={() =>
										onOpen({
											user1: { name: user1.name, photo: user1.image },
											user2: { name: user2.name, photo: user2.image },
										})
									}
								>
									<span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent group-hover/btn:text-white">
										View Match
									</span>
								</Button>
							</AuthGuard>
						</motion.div>
					</div>
				</div>
			</Card>
		</motion.div>
	);
};
