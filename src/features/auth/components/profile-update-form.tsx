"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { useUser } from "@/features/auth/api/get-me";
import type { UpdateMeInput } from "@/features/auth/api/update-me";
import { useUpdateMe } from "../api/update-me";

const profileUpdateSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),
	// school: z.string().min(1, { message: "School is required" }),
	// age: z
	// 	.number({
	// 		error: (issue) => (!issue.input ? "Age is required" : "Not a number"),
	// 	})
	// 	.min(16, { message: "Age must be at least 16" })
	// 	.max(100, { message: "Age must be less than 100" })
	// 	.optional(),
	// gender: z.string().min(1, { message: "Gender is required" }),
});

type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export function ProfileUpdateForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const user = useUser();

	const updateMeMutation = useUpdateMe({
		mutationConfig: {
			onSuccess: () => {
				// Invalidate all queries to refresh user data everywhere
				queryClient.invalidateQueries();
				// Force invalidate the live match query even if not currently active
				queryClient.invalidateQueries({
					queryKey: ["matching", "top", "infinite"],
					refetchType: "all", // This ensures the query refetches even when inactive
				});
				router.push("/");
			},
		},
	});

	const form = useForm<ProfileUpdateFormData>({
		resolver: zodResolver(profileUpdateSchema),
		defaultValues: {
			name: user?.name || "",
			// school: user?.school || "",
			// age: user?.age,
			// gender: user?.gender || "",
		},
		values: user
			? {
					name: user.name || "",
					// school: user.school || "",
					// age: user.age,
					// gender: user.gender || "",
				}
			: undefined,
	});

	const handleSubmit = (values: ProfileUpdateFormData) => {
		const updateData: UpdateMeInput = {
			name: values.name,
			// school: values.school,
			// age: values.age,
			// gender: values.gender,
		};
		updateMeMutation.mutate(updateData);
	};

	//   if (isLoading) {
	//     return (
	//       <Card className="w-full">
	//         <CardHeader>
	//           <Skeleton className="h-8 w-48" />
	//           <Skeleton className="h-4 w-64" />
	//         </CardHeader>
	//         <CardContent className="space-y-6">
	//           <div className="space-y-2">
	//             <Skeleton className="h-4 w-16" />
	//             <Skeleton className="h-10 w-full" />
	//           </div>
	//           <div className="space-y-2">
	//             <Skeleton className="h-4 w-16" />
	//             <Skeleton className="h-10 w-full" />
	//           </div>
	//           <div className="space-y-2">
	//             <Skeleton className="h-4 w-16" />
	//             <Skeleton className="h-10 w-full" />
	//           </div>
	//           <div className="space-y-2">
	//             <Skeleton className="h-4 w-16" />
	//             <Skeleton className="h-10 w-full" />
	//           </div>
	//           <Skeleton className="h-10 w-full" />
	//         </CardContent>
	//       </Card>
	//     );
	//   }

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Update Profile</CardTitle>
				<CardDescription>
					Update your personal information below
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
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

						{/* <FormField
							control={form.control}
							name="school"
							render={({ field }) => (
								<FormItem>
									<FormLabel>School/University</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your school or university"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/> */}

						<div className="grid sm:grid-cols-1 gap-4 align-start">
							{/* <FormField
								control={form.control}
								name="age"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Age</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Enter your age"
												{...field}
												value={field.value || ""}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/> */}

							{/* <FormField
								control={form.control}
								name="gender"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gender</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select your gender" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="male">Male</SelectItem>
												<SelectItem value="female">Female</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/> */}
						</div>

						<Button
							type="submit"
							disabled={updateMeMutation.isPending}
							className="w-full"
						>
							{updateMeMutation.isPending ? "Updating..." : "Update Profile"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
