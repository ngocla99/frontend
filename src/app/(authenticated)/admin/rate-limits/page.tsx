import { AdminContentSection } from "@/features/admin/components/admin-content-section";
import { RateLimitsForm } from "@/features/admin/forms/rate-limits-form";

export default function RateLimitsPage() {
	return (
		<AdminContentSection
			title="Rate Limits"
			desc="Configure daily usage limits for user actions."
		>
			<RateLimitsForm />
		</AdminContentSection>
	);
}
