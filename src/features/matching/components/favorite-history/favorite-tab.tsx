import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Heart, Trash2 } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReactToMatch } from "@/features/matching/api/react-to-match";
import type { UniversityMatch } from "@/features/matching/components/user-match/university-match/university-match-tab";
import { useUserMatchesActions } from "@/features/matching/store/user-matches";

interface FavoriteTabProps {
	favorites: UniversityMatch[];
}

export function FavoriteTab({ favorites }: FavoriteTabProps) {
	const { mutate: reactToMatch } = useReactToMatch();
	const { onOpen } = useUserMatchesActions();

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "celebrity":
				return "⭐";
			case "university":
				return "🎓";
			default:
				return "💫";
		}
	};

	const removeFavorite = (id: string) => {
		reactToMatch({ matchId: id, favorite: false });
	};

	const handleSelectFavorite = (favorite: UniversityMatch) => {
		onOpen({
			user1: { name: favorite.me.name, photo: favorite.me.image },
			user2: { name: favorite.other.name, photo: favorite.other.image },
		});
	};

	return (
		<div>
			{favorites.length === 0 ? (
				<div className="flex flex-col items-center justify-center text-muted-foreground pb-20">
					<Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
					<p>No favorites yet</p>
					<p className="text-sm">
						Add favorites by clicking the heart icon on matches
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<AnimatePresence>
						{favorites.map((favorite) => (
							<motion.div
								key={favorite.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, x: -100 }}
								className="group"
							>
								<Card className="p-4 hover:shadow-md transition-shadow">
									<div className="flex items-center gap-4">
										<div className="relative">
											<BlurImage
												src={favorite.other.image}
												alt={favorite.other.name}
												width={64}
												height={64}
												className="w-16 h-16 rounded-full object-cover"
											/>
											<div className="absolute -top-1 -right-1 text-lg">
												{getTypeIcon("university")}
											</div>
										</div>

										<div className="flex-1">
											<h3 className="font-semibold">{favorite.other.name}</h3>
											<div className="flex items-center gap-2 mt-1">
												<Badge variant="outline" className="text-xs">
													university
												</Badge>
												<span className="text-xs text-muted-foreground flex items-center gap-1">
													<Calendar className="w-3 h-3" />
													{favorite.timestamp}
												</span>
											</div>
										</div>

										<div className="flex gap-2">
											<Button
												size="sm"
												onClick={() => handleSelectFavorite(favorite)}
												className="opacity-0 group-hover:opacity-100 transition-opacity"
											>
												Select
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => removeFavorite(favorite.id)}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}
