"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
	useAdminSettings,
	useUpdateSettings,
} from "@/lib/hooks/use-admin-settings";

const featureTogglesFormSchema = z.object({
	allow_non_edu_emails: z.boolean(),
});

type FeatureTogglesFormValues = z.infer<typeof featureTogglesFormSchema>;

export function FeatureTogglesForm() {
	const { data: settings, isLoading } = useAdminSettings();
	const updateSettings = useUpdateSettings();

	const form = useForm<FeatureTogglesFormValues>({
		resolver: zodResolver(featureTogglesFormSchema),
		mode: "onChange",
		defaultValues: {
			allow_non_edu_emails: false,
		},
	});

	// Update form when settings are loaded
	useEffect(() => {
		if (settings) {
			form.reset({
				allow_non_edu_emails:
					(settings.allow_non_edu_emails as boolean) ?? false,
			});
		}
	}, [settings, form]);

	const onSubmit = async (data: FeatureTogglesFormValues) => {
		try {
			await updateSettings.mutateAsync({
				allow_non_edu_emails: data.allow_non_edu_emails,
			});
			toast.success("Feature toggle settings have been saved successfully.");
			form.reset(data); // Reset dirty state
		} catch (error) {
			toast.error("Failed to update settings. Please try again.");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{/* Email Validation Toggle */}
				<FormField
					control={form.control}
					name="allow_non_edu_emails"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<FormLabel className="text-base">
									Allow Non-.edu Emails
								</FormLabel>
								<FormDescription>
									Enable users to register with non-educational email addresses.
									When disabled, only .edu emails are accepted.
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-4">
					<Button
						type="submit"
						disabled={!form.formState.isDirty || updateSettings.isPending}
					>
						{updateSettings.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Save Changes
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => form.reset()}
						disabled={!form.formState.isDirty}
					>
						Reset
					</Button>
				</div>
			</form>
		</Form>
	);
}
