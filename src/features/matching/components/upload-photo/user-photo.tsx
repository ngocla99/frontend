import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { ImageLoader } from "@/components/image-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserUpload } from "@/features/matching/store/user-upload";
import { FavoriteHistory } from "../favorite-history/favorite-history";

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
				className="text-center space-y-8"
			>
				<div className="relative inline-block">
					<ImageLoader
						src={userUpload.image_url || ""}
						alt="User profile"
						width={128}
						height={128}
						className="rounded-full shadow-match"
					/>
					<Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
						{userUpload.gender === "male" ? "👨" : "👩"}
					</Badge>
				</div>

				<div className="flex gap-3 justify-center mb-2">
					<FavoriteHistory onSelectMatch={() => {}} />
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
