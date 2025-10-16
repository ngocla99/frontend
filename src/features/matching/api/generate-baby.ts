import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { BabyApi } from "@/types/api";

// API Function
export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
	return apiClient.post(`/api/v1/baby`, { match_id: matchId });
};

// Hooks
export const useGenerateBaby = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: generateBabyApi,
		onSuccess: (data, matchId) => {
			queryClient.setQueryData(["baby", "match", matchId], data);
			queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
		},
	});
};
