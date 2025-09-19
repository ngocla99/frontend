import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserUpload } from "@/features/matching/store/user-upload";

interface UserPhotoProps {
	onChangePhoto: () => void;
}

export function UserPhoto({ onChangePhoto }: UserPhotoProps) {
	const userUpload = useUserUpload();

	return (
		<Card className="p-6 bg-gradient-card border-0 shadow-soft">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-center space-y-4"
			>
				<div className="relative inline-block">
					<Avatar className="size-32 rounded-full object-cover border-4 border-primary shadow-match">
						<AvatarImage
							src={userUpload.image_url}
							alt="User profile"
							className="object-cover"
						/>
						<AvatarFallback>
							{userUpload.gender === "male" ? "👨" : "👩"}
						</AvatarFallback>
					</Avatar>
					<Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
						{userUpload.gender === "male" ? "👨" : "👩"}
					</Badge>
				</div>

				<div className="flex gap-3 justify-center">
					<Button
						variant="outline"
						size="sm"
						onClick={onChangePhoto}
						className="gap-2"
					>
						<RotateCcw className="w-4 h-4" />
						Change Photo
					</Button>
				</div>
			</motion.div>
		</Card>
	);
}
