import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { UserApi } from "@/types/api";

export const updateMeSchema = z.object({
	age: z.number().optional(),
	gender: z.string().optional(),
	name: z.string().optional(),
	school: z.string().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const updateMeApi = (input: UpdateMeInput): Promise<UserApi> => {
	return api.patch<UserApi>("/auth/me", input);
};

type UseUpdateMeOptions = {
	mutationConfig?: MutationConfig<typeof updateMeApi>;
};

export const useUpdateMe = ({ mutationConfig }: UseUpdateMeOptions = {}) => {
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (...args) => {
			toast.success("Profile updated successfully!");
			onSuccess?.(...args);
		},
		onError: (error: Error, ...args) => {
			const errorMessage = error.message || "User update failed";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: updateMeApi,
	});
};
