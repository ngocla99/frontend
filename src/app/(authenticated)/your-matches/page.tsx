"use client";

import { MatchDialog } from "@/features/matching/components/match-dialog/match-dialog";
import { MatchNavMobile } from "@/features/matching/components/match-nav-mobile";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";

export default function YourMatchesPage() {
	return (
		<section className="pt-24 min-h-screen bg-gradient-subtle px-4 sm:px-6 lg:px-8">
			<div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
				<UploadPhoto />
				<UserMatch />
				<MatchDialog />
			</div>
			<MatchNavMobile />
		</section>
	);
}
