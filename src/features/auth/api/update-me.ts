import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { getMeQueryOptions } from "@/features/auth/api/get-me";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { UserApi } from "@/types/api";

export const updateMeSchema = z.object({
	age: z.number().optional(),
	gender: z.string().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const updateMeApi = (input: UpdateMeInput): Promise<UserApi> => {
	return apiClient.patch(`/api/auth/me`, input);
};

type UseUpdateMeOptions = {
	mutationConfig?: MutationConfig<typeof updateMeApi>;
};

export const useUpdateMe = ({ mutationConfig }: UseUpdateMeOptions = {}) => {
	const queryClient = useQueryClient();

	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (...args) => {
			queryClient.invalidateQueries({
				queryKey: getMeQueryOptions().queryKey,
			});
			onSuccess?.(...args);
		},
		onError: (error: Error, ...args) => {
			console.log("🚀 ~ useUpdateMe ~ error:", error);
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.error
					: "User update failed";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: updateMeApi,
	});
};
