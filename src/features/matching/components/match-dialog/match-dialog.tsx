import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
	useMatchId,
	useMatchMode,
	useUserMatches,
	useUserMatchesActions,
	useUserMatchesOpen,
} from "../../store/user-matches";
import { BabyGenerator } from "./baby-generator";

export function MatchDialog() {
	const open = useUserMatchesOpen();
	const userMatches = useUserMatches();
	const matchId = useMatchId();
	const mode = useMatchMode();
	const { onOpenChange } = useUserMatchesActions();

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={onOpenChange}
			classes={{
				container:
					"sm:max-w-lg p-0 shadow-match bg-gradient-primary border-none",
			}}
			showCloseButton={false}
		>
			<BabyGenerator
				matchId={matchId || undefined}
				userPhoto={userMatches?.user1.photo}
				matchPhoto={userMatches?.user2.photo}
				userName={userMatches?.user1.name}
				matchName={userMatches?.user2.name}
				mode={mode}
				onBack={() => onOpenChange(false)}
			/>
		</ResponsiveDialog>
	);
}
