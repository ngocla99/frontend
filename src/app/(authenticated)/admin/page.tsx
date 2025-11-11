"use client";

import { AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	type MatchingWeights,
	useAdminSettings,
	useUpdateSettings,
} from "@/lib/hooks/use-admin-settings";

export default function AdminPage() {
	const { data: settings, isLoading, error } = useAdminSettings();
	const updateSettings = useUpdateSettings();

	// Local state for form values
	const [weights, setWeights] = useState<MatchingWeights>({
		embedding: 0.2,
		geometry: 0.2,
		age: 0.15,
		symmetry: 0.15,
		skin_tone: 0.15,
		expression: 0.15,
	});
	const [allowNonEduEmails, setAllowNonEduEmails] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Sync form state with fetched settings
	useEffect(() => {
		if (settings) {
			setWeights(settings.matching_weights);
			setAllowNonEduEmails(settings.allow_non_edu_emails);
		}
	}, [settings]);

	// Calculate sum of weights
	const weightsSum =
		weights.embedding +
		weights.geometry +
		weights.age +
		weights.symmetry +
		weights.skin_tone +
		weights.expression;

	// Check if sum is valid (within tolerance)
	const isValidSum = Math.abs(weightsSum - 1.0) < 0.001;

	// Update individual weight
	const updateWeight = (key: keyof MatchingWeights, value: number) => {
		setWeights((prev) => ({
			...prev,
			[key]: value,
		}));
		setHasChanges(true);
	};

	// Reset to original settings
	const handleReset = () => {
		if (settings) {
			setWeights(settings.matching_weights);
			setAllowNonEduEmails(settings.allow_non_edu_emails);
			setHasChanges(false);
			toast.info("Reset to saved settings");
		}
	};

	// Save changes
	const handleSave = async () => {
		if (!isValidSum) {
			toast.error("Weights must sum to 100%");
			return;
		}

		try {
			await updateSettings.mutateAsync({
				matching_weights: weights,
				allow_non_edu_emails: allowNonEduEmails,
			});

			toast.success("Settings updated successfully");
			setHasChanges(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update settings",
			);
		}
	};

	if (isLoading) {
		return (
			<div className="pt-20 container mx-auto p-6 max-w-4xl">
				<div className="flex items-center gap-2 mb-6">
					<Settings className="w-8 h-8" />
					<h1 className="text-3xl font-bold">Admin Settings</h1>
				</div>
				<Card>
					<CardContent className="p-6">
						<p className="text-muted-foreground">Loading settings...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="pt-20 container mx-auto p-6 max-w-4xl">
				<div className="flex items-center gap-2 mb-6">
					<Settings className="w-8 h-8" />
					<h1 className="text-3xl font-bold">Admin Settings</h1>
				</div>
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Failed to load settings. Please try again later.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="pt-20 container mx-auto p-6 max-w-4xl">
			{/* Header */}
			<div className="flex items-center gap-2 mb-6">
				<Settings className="w-8 h-8" />
				<h1 className="text-3xl font-bold">Admin Settings</h1>
			</div>

			{/* Validation Warning */}
			{!isValidSum && hasChanges && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Weights must sum to 100% (currently {(weightsSum * 100).toFixed(1)}
						%)
					</AlertDescription>
				</Alert>
			)}

			{/* Matching Algorithm Weights */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Matching Algorithm Weights</CardTitle>
					<CardDescription>
						Adjust the importance of each factor in the matching algorithm. All
						weights must sum to 100%.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Embedding Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="embedding">Facial Embedding</Label>
							<span className="text-sm font-medium">
								{(weights.embedding * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="embedding"
							min={0}
							max={1}
							step={0.01}
							value={[weights.embedding]}
							onValueChange={([value]) => updateWeight("embedding", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							Deep learning facial similarity based on neural network embeddings
						</p>
					</div>

					<Separator />

					{/* Geometry Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="geometry">Facial Geometry</Label>
							<span className="text-sm font-medium">
								{(weights.geometry * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="geometry"
							min={0}
							max={1}
							step={0.01}
							value={[weights.geometry]}
							onValueChange={([value]) => updateWeight("geometry", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							Facial proportions (width/height ratio, eye spacing, jawline,
							nose)
						</p>
					</div>

					<Separator />

					{/* Age Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="age">Age Compatibility</Label>
							<span className="text-sm font-medium">
								{(weights.age * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="age"
							min={0}
							max={1}
							step={0.01}
							value={[weights.age]}
							onValueChange={([value]) => updateWeight("age", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							Bonus for similar ages, penalty for large age gaps
						</p>
					</div>

					<Separator />

					{/* Symmetry Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="symmetry">Facial Symmetry</Label>
							<span className="text-sm font-medium">
								{(weights.symmetry * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="symmetry"
							min={0}
							max={1}
							step={0.01}
							value={[weights.symmetry]}
							onValueChange={([value]) => updateWeight("symmetry", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							Average of both faces' symmetry scores
						</p>
					</div>

					<Separator />

					{/* Skin Tone Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="skin_tone">Skin Tone Similarity</Label>
							<span className="text-sm font-medium">
								{(weights.skin_tone * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="skin_tone"
							min={0}
							max={1}
							step={0.01}
							value={[weights.skin_tone]}
							onValueChange={([value]) => updateWeight("skin_tone", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							CIELAB color distance for perceptually uniform skin tone matching
						</p>
					</div>

					<Separator />

					{/* Expression Weight */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="expression">Expression Match</Label>
							<span className="text-sm font-medium">
								{(weights.expression * 100).toFixed(0)}%
							</span>
						</div>
						<Slider
							id="expression"
							min={0}
							max={1}
							step={0.01}
							value={[weights.expression]}
							onValueChange={([value]) => updateWeight("expression", value)}
							className="w-full"
						/>
						<p className="text-xs text-muted-foreground">
							Bonus for matching facial expressions (happy, smile, neutral)
						</p>
					</div>

					<Separator />

					{/* Sum Display */}
					<div className="flex justify-between items-center pt-2">
						<span className="font-medium">Total:</span>
						<div className="flex items-center gap-2">
							<span
								className={`text-lg font-bold ${
									isValidSum ? "text-green-600" : "text-red-600"
								}`}
							>
								{(weightsSum * 100).toFixed(1)}%
							</span>
							{isValidSum ? (
								<CheckCircle2 className="w-5 h-5 text-green-600" />
							) : (
								<AlertCircle className="w-5 h-5 text-red-600" />
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Email Validation Settings */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Email Validation</CardTitle>
					<CardDescription>
						Control whether users can register with non-.edu email addresses
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="allow-non-edu">Allow Non-.edu Emails</Label>
							<p className="text-sm text-muted-foreground">
								When enabled, users can sign up with any email address
							</p>
						</div>
						<Switch
							id="allow-non-edu"
							checked={allowNonEduEmails}
							onCheckedChange={(checked) => {
								setAllowNonEduEmails(checked);
								setHasChanges(true);
							}}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3">
				<Button
					variant="outline"
					onClick={handleReset}
					disabled={!hasChanges || updateSettings.isPending}
				>
					Reset
				</Button>
				<Button
					onClick={handleSave}
					disabled={!hasChanges || !isValidSum || updateSettings.isPending}
				>
					{updateSettings.isPending ? "Saving..." : "Save Changes"}
				</Button>
			</div>
		</div>
	);
}
