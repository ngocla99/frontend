"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import {
	FileUpload,
	type FileUploadRef,
} from "@/components/kokonutui/file-upload";
import Stepper, { Step } from "@/components/stepper";
import { Button } from "@/components/ui/button";
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
import { useUploadFace } from "@/features/matching/api/upload-face";
import { ImageCropDialog } from "@/features/matching/components/upload-photo/image-crop-dialog";
import { base64ToFile } from "@/features/matching/utils";
import type { UserApi } from "@/types/api";
import { getMeQueryOptions, useUser } from "../api/get-me";
import { useUpdateMe } from "../api/update-me";

const onboardingSchema = z.object({
	name: z
		.string()
		.min(1, { message: "Name is required" })
		.max(15, { message: "Name must be 15 characters or less" }),
	//   school: z.string().min(1, { message: "School is required" }),
	// age: z
	// 	.number({
	// 		error: (issue) => (!issue.input ? "Age is required" : "Not a number"),
	// 	})
	// 	.min(16, { message: "Age must be at least 16" })
	// 	.max(100, { message: "Age must be less than 100" }),
	gender: z.string().min(1, { message: "Gender is required" }),
});

const TOTAL_ONBOARDING_STEPS = 3;

export function OnboardingForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const fileUploadRef = React.useRef<FileUploadRef>(null);
	const [currentStep, setCurrentStep] = React.useState(1);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
	const [uploadedFilePreview, setUploadedFilePreview] = React.useState<
		string | null
	>(null);
	const [verifiedFile, setVerifiedFile] = React.useState<File | null>(null);
	const [showCropDialog, setShowCropDialog] = React.useState(false);
	const currentUser = useUser();

	const uploadFaceMutation = useUploadFace();

	const updateMeMutation = useUpdateMe({
		mutationConfig: {
			onMutate: async (newUserData) => {
				// Cancel any outgoing refetches to prevent optimistic updates being overwritten
				await queryClient.cancelQueries({
					queryKey: getMeQueryOptions().queryKey,
				});

				// Snapshot the previous value
				const previousUser = queryClient.getQueryData<UserApi>(
					getMeQueryOptions().queryKey,
				);

				// Optimistically update to the new value
				if (currentUser) {
					queryClient.setQueryData<UserApi>(getMeQueryOptions().queryKey, {
						...currentUser,
						...newUserData,
					});
				}

				// Return a context object with the snapshotted value
				return { previousUser };
			},
			onError: (_err, _newUserData, context: any) => {
				// If the mutation fails, use the context returned from onMutate to roll back
				if (context?.previousUser) {
					queryClient.setQueryData(
						getMeQueryOptions().queryKey,
						context.previousUser,
					);
				}
			},
			onSuccess: () => {
				router.push("/");
			},
			onSettled: () => {
				// Always refetch after error or success to ensure we have the correct data
				queryClient.invalidateQueries({
					queryKey: getMeQueryOptions().queryKey,
				});
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
		if (
			updateMeMutation.isPending ||
			uploadFaceMutation.isPending ||
			!uploadedFile
		) {
			return;
		}

		setIsSubmitting(true);
		uploadFaceMutation.mutate(
			{ file: uploadedFile! },
			{
				onSuccess: () => {
					updateMeMutation.mutate(values);
				},
				onError: () => {
					setIsSubmitting(false);
				},
			},
		);
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

	const handleFileSelected = (file: File) => {
		// Skip verification - go straight to crop dialog
		setVerifiedFile(file);
		setShowCropDialog(true);
	};

	const handleCropComplete = async (croppedImageBase64: string) => {
		try {
			const croppedFile = await base64ToFile(
				croppedImageBase64,
				verifiedFile?.name || "cropped-image.png",
			);
			setUploadedFile(croppedFile);
			setUploadedFilePreview(croppedImageBase64);
			setShowCropDialog(false);
		} catch (error) {
			console.error("Failed to process cropped image:", error);
			setShowCropDialog(false);
			setVerifiedFile(null);
			fileUploadRef.current?.reset();
			// TODO: Show error toast to user
		}
	};

	const handleCancelCrop = () => {
		setShowCropDialog(false);
		setVerifiedFile(null);
		fileUploadRef.current?.reset();
	};

	const handleRemoveFile = () => {
		// Clean up the preview URL to prevent memory leaks
		if (uploadedFilePreview) {
			URL.revokeObjectURL(uploadedFilePreview);
		}
		setUploadedFile(null);
		setUploadedFilePreview(null);
		fileUploadRef.current?.reset();
	};

	// Cleanup preview URL on unmount
	React.useEffect(() => {
		return () => {
			if (uploadedFilePreview) {
				URL.revokeObjectURL(uploadedFilePreview);
			}
		};
	}, [uploadedFilePreview]);

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
			// 	return ["school"];
			default:
				return [];
		}
	};

	if (isSubmitting) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<AITextLoading
					texts={["Matching...", "Loading...", "Please wait..."]}
				/>
			</div>
		);
	}

	const nextButtonDisabled =
		!isCurrentStepValid(currentStep) ||
		updateMeMutation.isPending ||
		(currentStep === TOTAL_ONBOARDING_STEPS && !uploadedFilePreview);

	return (
		<div className="min-h-screen flex flex-col gap-4 items-stretch justify-center bg-transparent sm:bg-gradient-subtle px-4">
			<div className="text-center">
				<h2 className="text-2xl font-bold">Welcome!</h2>
				<p className="text-muted-foreground">
					Let's set up your profile to get started
				</p>
			</div>
			<Form {...form}>
				<form>
					<Stepper
						initialStep={currentStep}
						onStepChange={handleStepChange}
						onFinalStepCompleted={() => {
							// Validate all fields before final submission
							form.handleSubmit(onSubmit)();
						}}
						backButtonText="Previous"
						nextButtonText="Next"
						nextButtonProps={{
							disabled: nextButtonDisabled,
							className: `duration-350 flex items-center justify-center rounded-full py-1.5 px-3.5 font-medium tracking-tight text-white transition ${
								nextButtonDisabled
									? "bg-gray-300 cursor-not-allowed opacity-50"
									: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 active:from-pink-600 active:to-rose-600"
							}`,
						}}
						className="p-0 sm:p-4"
					>
						<Step className="pb-1">
							<div className="space-y-4">
								<h2 className="text-xl font-semibold text-center">
									What should we call you?
								</h2>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name or Initials</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., John or J.D."
													maxLength={15}
													{...field}
												/>
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
						<Step>
							<div className="space-y-4">
								{uploadedFilePreview ? (
									<div className="flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95 duration-300">
										{/* Image Preview */}
										<div className="relative group">
											{/* Image container */}
											<div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-2xl">
												<Image
													src={uploadedFilePreview}
													alt="Uploaded preview"
													width={192}
													height={192}
													className="w-full h-full object-cover"
													priority
												/>

												{/* Overlay on hover */}
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={handleRemoveFile}
														className="rounded-full"
													>
														<X className="size-4 mr-1" />
														Remove
													</Button>
												</div>
											</div>
										</div>
										{/* Change Photo Button */}
										<Button
											type="button"
											variant="outline"
											onClick={handleRemoveFile}
											className="mt-2"
										>
											Change Photo
										</Button>
									</div>
								) : !showCropDialog ? (
									<FileUpload
										ref={fileUploadRef}
										onUploadSuccess={handleFileSelected}
										acceptedFileTypes={[
											"image/png",
											"image/jpeg",
											"image/jpg",
											"image/webp",
										]}
										maxFileSize={10 * 1024 * 1024} // 10MB
										uploadDelay={100}
										validateFile={() => null}
										classes={{ container: "w-full", dropzone: "p-0" }}
										isOutlined={false}
									/>
								) : null}
							</div>
						</Step>
					</Stepper>
				</form>
			</Form>
			<ImageCropDialog
				open={showCropDialog}
				file={verifiedFile}
				onCancelCrop={handleCancelCrop}
				onCrop={handleCropComplete}
				onOpenChange={setShowCropDialog}
			/>
		</div>
	);
}
