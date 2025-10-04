import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import { useAccessToken, useSession } from "@/stores/auth-store";
import type { UserApi } from "@/types/api";

export const getMeApi = (): Promise<UserApi> => {
	return apiClient.get("/api/auth/me");
};

export const getMeQueryOptions = () => {
	return queryOptions({
		queryKey: ["auth", "me"],
		queryFn: () => getMeApi(),
	});
};

type UseMeOptions = {
	queryConfig?: QueryConfig<typeof getMeQueryOptions>;
};

export const useMe = ({ queryConfig }: UseMeOptions = {}) => {
	const session = useSession();
	const accessToken = useAccessToken();
	// Check for either Supabase session OR legacy OAuth token
	const hasValidAuth = !!(session?.access_token || accessToken);

	return useQuery({
		...getMeQueryOptions(),
		enabled: hasValidAuth, // Built-in auth verification (supports both flows)
		...queryConfig,
		// Merge enabled condition - both our check AND user's config must be true
		...(queryConfig?.enabled !== undefined && {
			enabled: hasValidAuth && queryConfig.enabled,
		}),
	});
};

export const useReadMeQuery = () => {
	const queryClient = useQueryClient();
	return queryClient.getQueryData<UserApi>(getMeQueryOptions().queryKey);
};
