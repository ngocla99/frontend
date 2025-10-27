import { queryOptions, useQuery } from "@tanstack/react-query";
import type { QueryConfig } from "@/lib/react-query";
import { useSession } from "@/stores/auth-store";
import type { UserApi } from "@/types/api";
import api from "@/lib/api-client";

export const getMeApi = async (): Promise<UserApi> => {
	return api.get<UserApi>("/auth/me");
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
	// Check for Supabase session
	const hasValidAuth = !!session?.access_token;

	return useQuery({
		...getMeQueryOptions(),
		enabled: hasValidAuth, // Only fetch if user is authenticated
		...queryConfig,
		// Merge enabled condition - both our check AND user's config must be true
		...(queryConfig?.enabled !== undefined && {
			enabled: hasValidAuth && queryConfig.enabled,
		}),
	});
};
