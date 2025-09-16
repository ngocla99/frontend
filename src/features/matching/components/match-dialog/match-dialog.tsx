import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
	useUserMatches,
	useUserMatchesActions,
	useUserMatchesOpen,
} from "../../store/user-matches";
import { BabyGenerator } from "./baby-generator";

export function MatchDialog() {
	const open = useUserMatchesOpen();
	const userMatches = useUserMatches();
	const { onOpenChange } = useUserMatchesActions();

	return (
		<ResponsiveDialog
			open={open}
			title={`${userMatches?.user1.name} & ${userMatches?.user2.name}'s Baby`}
			onOpenChange={onOpenChange}
		>
			<BabyGenerator
				userPhoto={userMatches?.user1.photo}
				matchPhoto={userMatches?.user2.photo}
				matchName={userMatches?.user2.name}
				onBack={() => onOpenChange(false)}
			/>
		</ResponsiveDialog>
	);
}
