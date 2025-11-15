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

/**
 * Schema for matching weights
 * All weights must be between 0 and 1, and sum to 1.0 (within tolerance)
 */
const matchingWeightsSchema = z
	.object({
		embedding: z.number().min(0).max(1),
		geometry: z.number().min(0).max(1),
		age: z.number().min(0).max(1),
		symmetry: z.number().min(0).max(1),
		skin_tone: z.number().min(0).max(1),
		expression: z.number().min(0).max(1),
	})
	.refine(
		(weights) => {
			const sum =
				weights.embedding +
				weights.geometry +
				weights.age +
				weights.symmetry +
				weights.skin_tone +
				weights.expression;
			// Allow small floating point tolerance
			return Math.abs(sum - 1.0) < 0.001;
		},
		{
			message: "Weights must sum to 1.0",
		},
	);

const matchingAlgorithmFormSchema = z.object({
	matching_weights: matchingWeightsSchema,
	match_threshold: z.number().min(0).max(1),
});

type MatchingAlgorithmFormValues = z.infer<typeof matchingAlgorithmFormSchema>;

const weightDescriptions: Record<string, string> = {
	embedding: "Overall facial similarity using AI embeddings",
	geometry: "Structural facial features and proportions",
	age: "Age compatibility between faces",
	symmetry: "Facial symmetry assessment",
	skin_tone: "Skin tone similarity",
	expression: "Facial expression matching",
};

export function MatchingAlgorithmForm() {
	const { data: settings, isLoading } = useAdminSettings();
	const updateSettings = useUpdateSettings();

	const form = useForm<MatchingAlgorithmFormValues>({
		resolver: zodResolver(matchingAlgorithmFormSchema),
		mode: "onChange",
		defaultValues: {
			matching_weights: {
				embedding: 0.4,
				geometry: 0.25,
				age: 0.15,
				symmetry: 0.1,
				skin_tone: 0.05,
				expression: 0.05,
			},
			match_threshold: 0.7,
		},
	});

	// Update form when settings are loaded
	useEffect(() => {
		if (settings?.matching_weights) {
			form.reset({
				matching_weights: settings.matching_weights as {
					embedding: number;
					geometry: number;
					age: number;
					symmetry: number;
					skin_tone: number;
					expression: number;
				},
				match_threshold: (settings.match_threshold as number) ?? 0.7,
			});
		}
	}, [settings, form]);

	const onSubmit = async (data: MatchingAlgorithmFormValues) => {
		try {
			await updateSettings.mutateAsync({
				matching_weights: data.matching_weights,
				match_threshold: data.match_threshold,
			});
			toast.success(
				"Matching algorithm settings have been saved successfully.",
			);
			form.reset(data); // Reset dirty state
		} catch (error) {
			toast.error("Failed to update settings. Please try again.");
		}
	};

	// Calculate current sum of weights
	const weights = form.watch("matching_weights");
	const weightsSum =
		weights.embedding +
		weights.geometry +
		weights.age +
		weights.symmetry +
		weights.skin_tone +
		weights.expression;
	const isSumValid = Math.abs(weightsSum - 1.0) < 0.001;

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
				{/* Matching Weights Section */}
				<div className="space-y-6">
					<div>
						<h4 className="text-sm font-medium">Matching Weights</h4>
						<p className="text-muted-foreground text-sm">
							Adjust the importance of each factor in the matching algorithm.
						</p>
					</div>

					{(
						Object.keys(weightDescriptions) as Array<
							keyof typeof weightDescriptions
						>
					).map((key) => (
						<FormField
							key={key}
							control={form.control}
							name={`matching_weights.${key}` as any}
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between">
										<FormLabel className="capitalize">
											{key.replace("_", " ")}
										</FormLabel>
										<span className="text-muted-foreground text-sm">
											{Math.round(field.value * 100)}%
										</span>
									</div>
									<FormControl>
										<Slider
											min={0}
											max={1}
											step={0.01}
											value={[field.value]}
											onValueChange={(vals) => field.onChange(vals[0])}
										/>
									</FormControl>
									<FormDescription className="text-xs">
										{weightDescriptions[key]}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					))}

					{/* Sum validation indicator */}
					<div className="flex items-center justify-between rounded-lg border p-3">
						<span className="text-sm font-medium">Total Weight</span>
						<span
							className={`text-sm font-semibold ${
								isSumValid
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{Math.round(weightsSum * 100)}%{!isSumValid && " (must be 100%)"}
						</span>
					</div>
				</div>

				{/* Match Threshold Section */}
				<FormField
					control={form.control}
					name="match_threshold"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-center justify-between">
								<FormLabel>Minimum Similarity Score</FormLabel>
								<span className="text-muted-foreground text-sm">
									{Math.round(field.value * 100)}%
								</span>
							</div>
							<FormControl>
								<Slider
									min={0}
									max={1}
									step={0.01}
									value={[field.value]}
									onValueChange={(vals) => field.onChange(vals[0])}
								/>
							</FormControl>
							<FormDescription>
								Determines the lowest similarity score required to create a
								match between two users.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => form.reset()}
						disabled={!form.formState.isDirty}
					>
						Reset
					</Button>
					<Button
						type="submit"
						disabled={
							!form.formState.isDirty || !isSumValid || updateSettings.isPending
						}
					>
						{updateSettings.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Save Changes
					</Button>
				</div>
			</form>
		</Form>
	);
}
