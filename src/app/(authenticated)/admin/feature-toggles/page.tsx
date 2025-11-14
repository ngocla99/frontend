import { AdminContentSection } from "@/features/admin/components/admin-content-section";
import { FeatureTogglesForm } from "@/features/admin/forms/feature-toggles-form";

export default function FeatureTogglesPage() {
	return (
		<AdminContentSection
			title="Feature Toggles"
			desc="Enable or disable specific application features."
		>
			<FeatureTogglesForm />
		</AdminContentSection>
	);
}
