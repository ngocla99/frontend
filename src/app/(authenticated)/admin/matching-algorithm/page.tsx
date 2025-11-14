import { AdminContentSection } from "@/features/admin/components/admin-content-section";
import { MatchingAlgorithmForm } from "@/features/admin/forms/matching-algorithm-form";

export default function MatchingAlgorithmPage() {
	return (
		<AdminContentSection
			title="Matching Algorithm"
			desc="Configure the weights and thresholds for the matching algorithm."
		>
			<MatchingAlgorithmForm />
		</AdminContentSection>
	);
}
