import { createFileRoute } from "@tanstack/react-router";
import { ProfileUpdateForm } from "@/features/auth/components/profile-update-form";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	return (
		<div className="container mx-auto pt-20 py-8 px-4 max-w-2xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Profile Settings</h1>
				<p className="text-muted-foreground mt-2">
					Update your personal information and preferences
				</p>
			</div>
			<ProfileUpdateForm />
		</div>
	);
}
