import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { getMeQueryOptions } from "@/features/auth/api/get-me";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { UserApi } from "@/types/api";

export const uploadFaceSchema = z.object({
	file: z.instanceof(File),
});

export type UploadFaceInput = z.infer<typeof uploadFaceSchema>;

export const uploadFaceApi = (
	input: UploadFaceInput,
): Promise<{ face_id: string; image_url: string }> => {
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
			queryClient.setQueryData(
				getMeQueryOptions().queryKey,
				(oldData?: UserApi) => {
					if (!oldData) return oldData;
					return { ...oldData, image: data.image_url };
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
