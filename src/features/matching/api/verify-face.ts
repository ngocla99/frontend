import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

export const verifyFaceSchema = z.object({
	file: z.instanceof(File),
});

export type VerifyFaceInput = z.infer<typeof verifyFaceSchema>;

export interface VerifyFaceResponse {
	face_detected: boolean;
	confidence?: number;
	bbox?: number[];
	message: string;
	error?: string;
}

export const verifyFaceApi = (
	input: VerifyFaceInput,
): Promise<VerifyFaceResponse> => {
	const formData = new FormData();
	formData.append("file", input.file);

	return api.post<VerifyFaceResponse>("/faces/verify", formData);
};

type UseVerifyFaceOptions = {
	mutationConfig?: MutationConfig<typeof verifyFaceApi>;
};

export const useVerifyFace = ({
	mutationConfig,
}: UseVerifyFaceOptions = {}) => {
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		onSuccess: (data, ...args) => {
			onSuccess?.(data, ...args);
			// Don't show success toast - let the parent component handle UI feedback
		},
		onError: (error: Error, ...args) => {
			const errorMessage =
				error.message ||
				"No face detected in image. Please upload a photo with a clear face.";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
		mutationFn: verifyFaceApi,
	});
};
