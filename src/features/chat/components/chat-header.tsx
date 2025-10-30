"use client";

import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
	otherUser: {
		name: string;
		profile_image: string | null;
	};
	babyImage: string | null;
	onBack?: () => void;
	onArchive?: () => void;
	onBlock?: () => void;
}

export function ChatHeader({
	otherUser,
	babyImage,
	onBack,
	onArchive,
	onBlock,
}: ChatHeaderProps) {
	const initials = otherUser.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg">
			{/* Baby Image Header */}
			{/* {babyImage && (
				<div className="relative h-48 w-full bg-gradient-to-b from-purple-100 to-white dark:from-purple-900/20 dark:to-gray-950">
					<Image
						width={400}
						height={192}
						src={babyImage}
						alt="Generated baby"
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-gray-950/80 to-transparent" />
				</div>
			)} */}

			{/* User Info Header */}
			<div className="flex items-center gap-3 px-4 py-3">
				{onBack && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="shrink-0"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
				)}

				<Avatar className="h-10 w-10 shrink-0">
					<AvatarImage src={otherUser.profile_image || undefined} />
					<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
						{initials}
					</AvatarFallback>
				</Avatar>

				<div className="flex-1 min-w-0">
					<h2 className="font-semibold text-gray-900 dark:text-white truncate">
						{otherUser.name}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
				</div>

				{/* <div className="flex items-center gap-1 lg:gap-2">
					{(onArchive || onBlock) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="shrink-0 h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6"
								>
									<MoreVertical className="h-5 w-5 sm:size-5 stroke-muted-foreground" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{onArchive && (
									<DropdownMenuItem onClick={onArchive}>
										Archive conversation
									</DropdownMenuItem>
								)}
								{onBlock && (
									<DropdownMenuItem onClick={onBlock} className="text-red-600">
										Block user
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div> */}
			</div>
		</div>
	);
}
