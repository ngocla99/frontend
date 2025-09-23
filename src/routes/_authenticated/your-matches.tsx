import { createFileRoute } from "@tanstack/react-router";
import { MatchNavMobile } from "@/features/matching/components/match-nav-mobile";
import { UploadPhoto } from "@/features/matching/components/upload-photo/upload-photo";
import { UserMatch } from "@/features/matching/components/user-match/user-match";

export const Route = createFileRoute("/_authenticated/your-matches")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<section className="pt-24 min-h-screen bg-gradient-subtle px-4 sm:px-6 lg:px-8">
			<div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
				<UploadPhoto />
				<UserMatch />

				{/* {showBabyGenerator && (
				<div className="animate-fade-in">
					<BabyGenerator
						userPhoto={user?.image}
						matchPhoto={
							selectedMatch?.image ||
							selectedCelebrity?.image ||
							selectedCustomMatch?.image
						}
						matchName={
							selectedMatch?.name ||
							selectedCelebrity?.name ||
							selectedCustomMatch?.name
						}
						onBack={() => setShowBabyGenerator(false)}
					/>
				</div>
			)} */}
			</div>
			<MatchNavMobile />
		</section>
	);
}
