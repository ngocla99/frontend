import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import { useAuth } from "@/stores/auth-store";
import type { UserApi } from "@/types/api";

const isValidAccessToken = (token: string): boolean => {
	return (
		!!token && token.trim() !== "" && token !== "undefined" && token !== "null"
	);
};

export const getMeApi = (): Promise<UserApi> => {
	return apiClient.get("/api/auth/me");
};

export const getMeQueryOptions = () => {
	return queryOptions({
		queryKey: ["auth", "me"],
		queryFn: () => getMeApi(),
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

type UseMeOptions = {
	queryConfig?: QueryConfig<typeof getMeQueryOptions>;
};

export const useMe = ({ queryConfig }: UseMeOptions = {}) => {
	const { accessToken } = useAuth();
	const hasValidToken = isValidAccessToken(accessToken);

	return useQuery({
		...getMeQueryOptions(),
		enabled: hasValidToken, // Built-in access token verification
		...queryConfig,
		// Merge enabled condition - both our check AND user's config must be true
		...(queryConfig?.enabled !== undefined && {
			enabled: hasValidToken && queryConfig.enabled,
		}),
	});
};

export const useReadMeQuery = () => {
	const queryClient = useQueryClient();
	return queryClient.getQueryData<UserApi>(getMeQueryOptions().queryKey);
};
