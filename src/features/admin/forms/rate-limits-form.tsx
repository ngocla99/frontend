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
import { Slider } from "@/components/ui/slider";
import {
	useAdminSettings,
	useUpdateSettings,
} from "@/lib/hooks/use-admin-settings";

const rateLimitsFormSchema = z.object({
	daily_baby_generation_limit: z
		.number()
		.int()
		.min(-1)
		.describe("Daily baby generation limit (-1 = unlimited, 0 = blocked)"),
	daily_photo_upload_limit: z
		.number()
		.int()
		.min(-1)
		.describe("Daily photo upload limit (-1 = unlimited, 0 = blocked)"),
});

type RateLimitsFormValues = z.infer<typeof rateLimitsFormSchema>;

export function RateLimitsForm() {
	const { data: settings, isLoading } = useAdminSettings();
	const updateSettings = useUpdateSettings();

	const form = useForm<RateLimitsFormValues>({
		resolver: zodResolver(rateLimitsFormSchema),
		mode: "onChange",
		defaultValues: {
			daily_baby_generation_limit: 10,
			daily_photo_upload_limit: 20,
		},
	});

	// Update form when settings are loaded
	useEffect(() => {
		if (settings) {
			form.reset({
				daily_baby_generation_limit:
					(settings.daily_baby_generation_limit as number) ?? 10,
				daily_photo_upload_limit:
					(settings.daily_photo_upload_limit as number) ?? 20,
			});
		}
	}, [settings, form]);

	const onSubmit = async (data: RateLimitsFormValues) => {
		try {
			await updateSettings.mutateAsync({
				daily_baby_generation_limit: data.daily_baby_generation_limit,
				daily_photo_upload_limit: data.daily_photo_upload_limit,
			});
			toast.success("Rate limit settings have been saved successfully.");
			form.reset(data); // Reset dirty state
		} catch (error) {
			toast.error("Failed to update settings. Please try again.");
		}
	};

	const formatLimitValue = (value: number): string => {
		if (value === -1) return "Unlimited";
		if (value === 0) return "Blocked";
		return value.toString();
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
				{/* Baby Generation Limit */}
				<FormField
					control={form.control}
					name="daily_baby_generation_limit"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel>Daily Baby Generation Limit</FormLabel>
								<span className="text-muted-foreground text-sm font-medium">
									{formatLimitValue(field.value)}
								</span>
							</div>
							<FormControl>
								<Slider
									min={-1}
									max={50}
									step={1}
									value={[field.value]}
									onValueChange={(vals) => field.onChange(vals[0])}
								/>
							</FormControl>
							<FormDescription>
								Maximum number of baby images a user can generate per day. Set
								to -1 for unlimited, or 0 to block all generations.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Photo Upload Limit */}
				<FormField
					control={form.control}
					name="daily_photo_upload_limit"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel>Daily Photo Upload Limit</FormLabel>
								<span className="text-muted-foreground text-sm font-medium">
									{formatLimitValue(field.value)}
								</span>
							</div>
							<FormControl>
								<Slider
									min={-1}
									max={100}
									step={1}
									value={[field.value]}
									onValueChange={(vals) => field.onChange(vals[0])}
								/>
							</FormControl>
							<FormDescription>
								Maximum number of photos a user can upload per day. Set to -1
								for unlimited, or 0 to block all uploads.
							</FormDescription>
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
