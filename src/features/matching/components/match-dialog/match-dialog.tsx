import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  useMatchId,
  useUserMatches,
  useUserMatchesActions,
  useUserMatchesOpen,
} from "../../store/user-matches";
import { BabyGenerator } from "./baby-generator";

export function MatchDialog() {
  const open = useUserMatchesOpen();
  const userMatches = useUserMatches();
  const matchId = useMatchId();
  const { onOpenChange } = useUserMatchesActions();

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      classes={{
        container: "p-0 shadow-match bg-gradient-primary border-none",
      }}
      showCloseButton={false}
    >
      <BabyGenerator
        matchId={matchId || undefined}
        userPhoto={userMatches?.user1.photo}
        matchPhoto={userMatches?.user2.photo}
        matchName={userMatches?.user2.name}
        onBack={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}
