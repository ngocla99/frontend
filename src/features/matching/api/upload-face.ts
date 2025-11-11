import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { getMeQueryOptions } from "@/features/auth/api/get-me";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { UserApi, UserPhotosResponse } from "@/types/api";
import { getUserPhotosQueryOptions } from "./get-user-photos";

export const uploadFaceSchema = z.object({
	file: z.instanceof(File),
});

export type UploadFaceInput = z.infer<typeof uploadFaceSchema>;

export const uploadFaceApi = (
	input: UploadFaceInput,
): Promise<{ id: string; image_url: string; created_at: string }> => {
	const formData = new FormData();
	formData.append("file", input.file);

	return api.post<{ id: string; image_url: string; created_at: string }>(
		"/faces",
		formData,
	);
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
				(oldData?: UserPhotosResponse) => {
					if (!oldData) return oldData;

					const newPhoto = {
						id: data.id,
						image_url: data.image_url,
						created_at: new Date().toISOString(),
						number_of_user_matches: 0,
					};

					return {
						faces: [newPhoto, ...oldData.faces],
						number_of_faces: oldData.number_of_faces + 1,
					};
				},
			);
			onSuccess?.(data, ...args);
			toast.success("Upload face success");
		},
		onError: (error: Error, ...args) => {
			const errorMessage = error.message || "Upload face failed";
			onError?.(error, ...args);
			toast.error(errorMessage);
		},
		...restConfig,
		mutationFn: uploadFaceApi,
	});
};
