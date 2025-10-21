import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import Stepper, { Step } from "@/components/stepper";
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
import { getMeQueryOptions } from "../api/get-me";
import { useUpdateMe } from "../api/update-me";

const onboardingSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	//   school: z.string().min(1, { message: "School is required" }),
	// age: z
	// 	.number({
	// 		error: (issue) => (!issue.input ? "Age is required" : "Not a number"),
	// 	})
	// 	.min(16, { message: "Age must be at least 16" })
	// 	.max(100, { message: "Age must be less than 100" }),
	gender: z.string().min(1, { message: "Gender is required" }),
});

export function OnboardingForm() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [currentStep, setCurrentStep] = React.useState(1);

	const updateMeMutation = useUpdateMe({
		mutationConfig: {
			onSuccess: () => {
				navigate({ to: "/" });
				queryClient.invalidateQueries({
					queryKey: getMeQueryOptions().queryKey,
				});
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
			//   school: "",
			gender: "",
			// age: undefined,
		},
	});

	const onSubmit = (values: UpdateMeInput) => {
		if (updateMeMutation.isPending) return;
		updateMeMutation.mutate(values);
	};

	// Watch form values to determine if current step is valid
	form.watch();

	const isCurrentStepValid = (step: number) => {
		const currentStepFields = getStepFields(step);
		return currentStepFields.every((field) => {
			const value = form.getValues(
				field as keyof z.infer<typeof onboardingSchema>,
			);
			return value !== undefined && value !== "";
		});
	};

	const handleStepChange = (step: number) => {
		setCurrentStep(step);
	};

	const getStepFields = (step: number) => {
		switch (step) {
			case 1:
				return ["name"];
			case 2:
				return ["gender"];
			// case 3:
			// return ["school"];
			default:
				return [];
		}
	};

	return (
		<div className="min-h-screen flex flex-col gap-4 items-stretch justify-center bg-transparent sm:bg-gradient-subtle px-4">
			<div className="text-center">
				<h2 className="text-2xl font-bold">Welcome!</h2>
				<p className="text-muted-foreground">
					Let's set up your profile to get started
				</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Stepper
						initialStep={1}
						onStepChange={handleStepChange}
						onFinalStepCompleted={() => {
							// Validate all fields before final submission
							form.handleSubmit(onSubmit)();
						}}
						backButtonText="Previous"
						nextButtonText="Next"
						nextButtonProps={{
							disabled:
								!isCurrentStepValid(currentStep) || updateMeMutation.isPending,
							className: `duration-350 flex items-center justify-center rounded-full py-1.5 px-3.5 font-medium tracking-tight text-white transition ${
								!isCurrentStepValid(currentStep) || updateMeMutation.isPending
									? "bg-gray-300 cursor-not-allowed opacity-50"
									: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 active:from-pink-600 active:to-rose-600"
							}`,
						}}
						className="p-0 sm:p-4"
					>
						<Step className="pb-1">
							<div className="space-y-4">
								<h2 className="text-xl font-semibold text-center">
									What's your name?
								</h2>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter your first name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</Step>

						{/* <Step className="pb-1">
							<div className="space-y-4">
								<h2 className="text-xl font-semibold text-center">
									Where do you study?
								</h2>
								<FormField
									control={form.control}
									name="school"
									render={({ field }) => (
										<FormItem>
											<FormLabel>School</FormLabel>
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
							</div>
						</Step> */}

						<Step className="pb-1">
							<div className="space-y-4">
								<h2 className="text-xl font-semibold text-center">
									What's your gender?
								</h2>
								<FormField
									control={form.control}
									name="gender"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Gender</FormLabel>
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
						</Step>
					</Stepper>
				</form>
			</Form>
		</div>
	);
}
