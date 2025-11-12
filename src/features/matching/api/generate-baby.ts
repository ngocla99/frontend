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
		onError: (error: any, ...args) => {
			// Handle rate limit errors (429) with specific messaging
			if (error.status === 429 && error.data) {
				const { limit, current, resetAt, message } = error.data;
				const resetDate = new Date(resetAt);
				const resetTimeStr = resetDate.toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit",
				});

				toast.error(
					`Daily limit reached (${current}/${limit}). Resets at ${resetTimeStr} UTC.`,
					{
						duration: 5000,
					},
				);
			} else {
				// Handle other errors
				const errorMessage = error.message || "Failed to generate baby image";
				toast.error(errorMessage);
			}

			onError?.(error, ...args);
		},
		...restConfig,
	});
};
