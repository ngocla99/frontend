"use client";

import { MagicLinkForm } from "@/features/auth/components/magic-link-form";

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<MagicLinkForm mode="signup" />
		</div>
	);
}
