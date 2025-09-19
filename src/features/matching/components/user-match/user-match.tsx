import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CelebritySearch } from "@/old/components/CelebritySearch";
import { UniversityMatchTab } from "./university-match-tab";

export function UserMatch() {
	const [activeTab, setActiveTab] = useState("university");

	return (
		<div className="animate-fade-in">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border h-[38px]">
					<TabsTrigger value="university" className="font-medium">
						University
					</TabsTrigger>
					<TabsTrigger value="celebrity" className="font-medium">
						Celebrities
					</TabsTrigger>
				</TabsList>

				<TabsContent value="university">
					<UniversityMatchTab />
				</TabsContent>

				<TabsContent value="celebrity">
					<CelebritySearch />
				</TabsContent>
			</Tabs>
		</div>
	);
}
