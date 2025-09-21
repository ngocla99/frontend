import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { UpdateMeInput } from "@/features/auth/api/update-me";
import { useUpdateMe } from "../api/update-me";

const onboardingSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	school: z.string().min(1, { message: "School is required" }),
	age: z
		.number({
			error: (issue) => (!issue.input ? "Age is required" : "Not a number"),
		})
		.min(16, { message: "Age must be at least 16" })
		.max(100, { message: "Age must be less than 100" }),
	gender: z.string().min(1, { message: "Gender is required" }),
});

export function OnboardingForm() {
	const navigate = useNavigate();
	const updateMeMutation = useUpdateMe({
		mutationConfig: {
			onSuccess: () => {
				console.log("Onboarding successful");
				navigate({ to: "/" });
			},
			onError: (error) => {
				console.error("Onboarding failed:", error);
			},
		},
	});

	const form = useForm<z.infer<typeof onboardingSchema>>({
		resolver: zodResolver(onboardingSchema),
		defaultValues: {
			name: "",
			school: "",
			age: undefined,
			gender: "",
		},
	});

	const onSubmit = (values: UpdateMeInput) => {
		if (updateMeMutation.isPending) return;
		updateMeMutation.mutate(values);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-transparent sm:bg-gradient-subtle px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
					<CardDescription>
						Let's set up your profile to get started with AI matching
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name *</FormLabel>
										<FormControl>
											<Input placeholder="Enter your first name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="school"
								render={({ field }) => (
									<FormItem>
										<FormLabel>School *</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter your school or university"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid sm:grid-cols-2 gap-4 align-start">
								<FormField
									control={form.control}
									name="age"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Age *</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Enter your age"
													{...field}
													onChange={(e) => {
														const value = e.target.value;
														field.onChange(
															value === "" ? undefined : Number(value),
														);
													}}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="gender"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Gender *</FormLabel>
											<FormControl>
												<Select
													value={field.value || ""}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select your gender" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="male">Male</SelectItem>
														<SelectItem value="female">Female</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={updateMeMutation.isPending}
							>
								{updateMeMutation.isPending
									? "Setting up..."
									: "Complete Setup"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
