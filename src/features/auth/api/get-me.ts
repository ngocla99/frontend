import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
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
	return useQuery({
		...getMeQueryOptions(),
		...queryConfig,
	});
};

export const useReadMeQuery = () => {
	const queryClient = useQueryClient();
	return queryClient.getQueryData<UserApi>(getMeQueryOptions().queryKey);
};
