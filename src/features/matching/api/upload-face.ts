import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { getMeQueryOptions } from "@/features/auth/api/get-me";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { PhotoUpload, UserApi } from "@/types/api";
import { getUserPhotosQueryOptions } from "./get-user-photos";

export const uploadFaceSchema = z.object({
	file: z.instanceof(File),
});

export type UploadFaceInput = z.infer<typeof uploadFaceSchema>;

export const uploadFaceApi = (
	input: UploadFaceInput,
): Promise<{ id: string; image_url: string; live_task_id: string }> => {
	const formData = new FormData();
	formData.append("file", input.file);

	return apiClient.post("/api/v1/me/faces", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
};

type UseUploadFaceOptions = {
	mutationConfig?: MutationConfig<typeof uploadFaceApi>;
};

export const useUploadFace = ({
	mutationConfig,
}: UseUploadFaceOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (data, ...args) => {
			onSuccess?.(data, ...args);
			toast.success("Upload face success");

			// Update user profile image
			queryClient.setQueryData(
				getMeQueryOptions().queryKey,
				(oldData?: UserApi) => {
					if (!oldData) return oldData;
					return { ...oldData, image: data.image_url };
				},
			);

			// Optimistically update user photos list
			queryClient.setQueryData(
				getUserPhotosQueryOptions().queryKey,
				(oldData?: PhotoUpload[]) => {
					if (!oldData) return oldData;

					const newPhoto: PhotoUpload = {
						id: data.id,
						image_url: data.image_url,
						created_at: new Date().toISOString(),
					};

					return [newPhoto, ...oldData];
				},
			);
		},
		onError: (error: Error, ...args) => {
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.error
					: "Upload face failed";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: uploadFaceApi,
	});
};
