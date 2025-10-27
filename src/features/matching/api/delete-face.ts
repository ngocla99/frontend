import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import { getUserPhotosQueryOptions } from "./get-user-photos";

export const deleteFaceApi = (faceId: string): Promise<{ message: string; id: string }> => {
	return api.delete<{ message: string; id: string }>(`/faces/${faceId}`);
};

type UseDeleteFaceOptions = {
	mutationConfig?: MutationConfig<typeof deleteFaceApi>;
};

export const useDeleteFace = ({ mutationConfig }: UseDeleteFaceOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		mutationFn: deleteFaceApi,
		onSuccess: (data, ...args) => {
			toast.success("Face deleted successfully");
			queryClient.invalidateQueries(getUserPhotosQueryOptions());
			onSuccess?.(data, ...args);
		},
		onError: (error: Error, ...args) => {
			const errorMessage = error.message || "Failed to delete face";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
	});
};
