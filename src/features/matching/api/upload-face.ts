import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import apiClient from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

export const uploadFaceSchema = z.object({
	file: z.instanceof(File),
});

export type UploadFaceInput = z.infer<typeof uploadFaceSchema>;

export const uploadFaceApi = (
	input: UploadFaceInput,
): Promise<{ face_id: string; image_url: string }> => {
	const formData = new FormData();
	formData.append("file", input.file);

	return apiClient.post("/api/v1/faces", formData, {
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
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (...args) => {
			onSuccess?.(...args);
			toast.success("Upload face success");
		},
		onError: (error: Error, ...args) => {
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.message
					: "Upload face failed";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: uploadFaceApi,
	});
};
