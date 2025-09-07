import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Heart, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
	type FavoriteMatch,
	type GeneratedBaby,
	storage,
} from "../lib/storage";

interface FavoritesManagerProps {
	onSelectMatch?: (match: any) => void;
}

export const FavoritesManager = ({ onSelectMatch }: FavoritesManagerProps) => {
	const [favorites, setFavorites] = useState<FavoriteMatch[]>([]);
	const [babyHistory, setBabyHistory] = useState<GeneratedBaby[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		loadData();
	}, [isOpen]);

	const loadData = () => {
		setFavorites(storage.getFavorites());
		setBabyHistory(storage.getBabyHistory());
	};

	const removeFavorite = (id: string) => {
		storage.removeFavorite(id);
		setFavorites(storage.getFavorites());
	};

	const deleteBaby = (id: string) => {
		storage.deleteBaby(id);
		setBabyHistory(storage.getBabyHistory());
	};

	const handleSelectFavorite = (favorite: FavoriteMatch) => {
		setIsOpen(false);
		if (onSelectMatch) {
			onSelectMatch({
				id: favorite.id,
				name: favorite.name,
				image: favorite.image,
				type: favorite.type,
			});
		}
	};

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - timestamp;
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString();
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "celebrity":
				return "⭐";
			case "university":
				return "🎓";
			case "custom":
				return "📸";
			default:
				return "💫";
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Heart className="w-4 h-4" />
					Favorites & History
					{favorites.length + babyHistory.length > 0 && (
						<Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
							{favorites.length + babyHistory.length}
						</Badge>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Star className="w-5 h-5" />
						Favorites & History
					</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="favorites" className="flex-1">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="favorites">
							Favorites ({favorites.length})
						</TabsTrigger>
						<TabsTrigger value="history">
							Baby History ({babyHistory.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="favorites"
						className="mt-4 max-h-96 overflow-y-auto"
					>
						{favorites.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
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
														<img
															src={favorite.image}
															alt={favorite.name}
															className="w-16 h-16 rounded-full object-cover"
														/>
														<div className="absolute -top-1 -right-1 text-lg">
															{getTypeIcon(favorite.type)}
														</div>
													</div>

													<div className="flex-1">
														<h3 className="font-semibold">{favorite.name}</h3>
														<div className="flex items-center gap-2 mt-1">
															<Badge variant="outline" className="text-xs">
																{favorite.type}
															</Badge>
															<span className="text-xs text-muted-foreground flex items-center gap-1">
																<Calendar className="w-3 h-3" />
																{formatDate(favorite.timestamp)}
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
					</TabsContent>

					<TabsContent
						value="history"
						className="mt-4 max-h-96 overflow-y-auto"
					>
						{babyHistory.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<div className="text-4xl mb-3">👶</div>
								<p>No baby generations yet</p>
								<p className="text-sm">
									Generate your first baby to see it here
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<AnimatePresence>
									{babyHistory.map((baby) => (
										<motion.div
											key={baby.id}
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.9 }}
										>
											<Card className="p-4 group hover:shadow-md transition-shadow">
												<div className="space-y-3">
													<div className="flex justify-between items-start">
														<h3 className="font-semibold text-sm">
															Baby with {baby.matchName}
														</h3>
														<Button
															size="sm"
															variant="outline"
															onClick={() => deleteBaby(baby.id)}
															className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive p-1.5"
														>
															<Trash2 className="w-3 h-3" />
														</Button>
													</div>

													<div className="flex items-center justify-between">
														<img
															src={baby.userPhoto}
															alt="You"
															className="w-12 h-12 rounded-full object-cover"
														/>
														<img
															src={baby.babyImage}
															alt="Baby"
															className="w-16 h-16 rounded-full object-cover border-2 border-primary"
														/>
														<img
															src={baby.matchPhoto}
															alt={baby.matchName}
															className="w-12 h-12 rounded-full object-cover"
														/>
													</div>

													<div className="flex items-center justify-between text-xs text-muted-foreground">
														<Badge variant="outline" className="text-xs">
															{baby.matchType}
														</Badge>
														<span className="flex items-center gap-1">
															<Calendar className="w-3 h-3" />
															{formatDate(baby.timestamp)}
														</span>
													</div>
												</div>
											</Card>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
