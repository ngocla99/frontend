"use client";

import { MagicLinkForm } from "@/features/auth/components/magic-link-form";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<MagicLinkForm mode="signin" />
		</div>
	);
}
