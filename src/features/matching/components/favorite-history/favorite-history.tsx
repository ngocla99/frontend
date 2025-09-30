import { Heart, Star } from "lucide-react";
import React from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type UserMatchInput,
	useUserMatch,
} from "@/features/matching/api/get-user-match";
import { PAGINATION } from "@/lib/constants/constant";
import { BabyTab } from "./baby-tab";
import { FavoriteTab } from "./favorite-tab";

const initQueryFavoriteOptions: UserMatchInput = {
	limit: PAGINATION.DEFAULT_LIMIT,
	offset: PAGINATION.DEFAULT_OFFSET,
	reaction: "favorite",
};

export function FavoriteHistory() {
	const [isOpen, setIsOpen] = React.useState(false);
	const [babyHistory] = React.useState<unknown[]>([]);

	// Get all user matches and filter for favorites
	const { data: favorites = [] } = useUserMatch({
		input: {
			...initQueryFavoriteOptions,
		},
	});

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			classes={{
				content: "h-[80vh] grid-rows-[auto_1fr] gap-8",
			}}
			title={
				<div className="flex items-center gap-2">
					<Star className="w-5 h-5" />
					Favorites & History
				</div>
			}
			trigger={
				<Button variant="outline" size="sm" className="gap-2">
					<Heart className="w-4 h-4" />
					History
				</Button>
			}
		>
			<BabyTab />
			{/* <Tabs defaultValue="favorites" className="h-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="favorites">
						Favorites ({favorites.length})
					</TabsTrigger>
					<TabsTrigger value="history">
						Baby History ({babyHistory.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="favorites" className="mt-4 overflow-y-auto grid">
					<FavoriteTab favorites={favorites} />
				</TabsContent>

				<TabsContent value="history" className="mt-4 max-h-96 overflow-y-auto">
					<BabyTab />
				</TabsContent>
			</Tabs> */}
		</ResponsiveDialog>
	);
}
