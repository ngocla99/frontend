import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
	return api.post<BabyApi>("/baby", { match_id: matchId });
};

type UseGenerateBabyOptions = {
	mutationConfig?: MutationConfig<typeof generateBabyApi>;
};

export const useGenerateBaby = ({
	mutationConfig,
}: UseGenerateBabyOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, onError, ...restConfig } = mutationConfig || {};

	return useMutation({
		mutationFn: generateBabyApi,
		onSuccess: (data, matchId, ...args) => {
			queryClient.setQueryData(["baby", "match", matchId], data);
			queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
			onSuccess?.(data, matchId, ...args);
		},
		onError: (error: Error, ...args) => {
			const errorMessage = error.message || "Failed to generate baby image";
			toast.error(errorMessage);
			onError?.(error, ...args);
		},
		...restConfig,
	});
};
