import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Type definitions for system settings
 */
export type MatchingWeights = {
	embedding: number;
	geometry: number;
	age: number;
	symmetry: number;
	skin_tone: number;
	expression: number;
};

export type SystemSettings = {
	matching_weights: MatchingWeights;
	allow_non_edu_emails: boolean;
	match_threshold: number;
};

export type UpdateSettingsInput = Partial<SystemSettings>;

/**
 * Hook to fetch admin settings
 */
export function useAdminSettings() {
	return useQuery<SystemSettings>({
		queryKey: ["admin", "settings"],
		queryFn: async () => {
			const response = await fetch("/api/admin/settings");

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to fetch settings");
			}

			const result = await response.json();
			return result.data;
		},
	});
}

/**
 * Hook to update admin settings
 */
export function useUpdateSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (updates: UpdateSettingsInput) => {
			const response = await fetch("/api/admin/settings", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update settings");
			}

			return response.json();
		},
		onSuccess: () => {
			// Invalidate settings query to refetch
			queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
		},
	});
}
