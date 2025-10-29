"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CelebrityMatchTab } from "./celebrity-match/celebrity-match-tab";
import { PhotoFilter } from "./photo-filter";
import { UniversityMatchTab } from "./university-match/university-match-tab";

export function UserMatch() {
	const [activeTab, setActiveTab] = useState("university");
	const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

	return (
		<div className="animate-fade-in">
			<PhotoFilter
				activePhotoId={activePhotoId}
				onPhotoSelect={setActivePhotoId}
				className="mb-6"
			/>
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
					<UniversityMatchTab activePhotoId={activePhotoId} />
				</TabsContent>

				<TabsContent value="celebrity">
					<CelebrityMatchTab activePhotoId={activePhotoId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
