import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
// import type { FaceApi } from "@/types/api";

export const getLiveMatchApi = (): Promise<any> => {
	return apiClient.get("/api/v1/live-match/results");
};

export const getLiveMatchQueryOptions = () => {
	return queryOptions({
		queryKey: ["live-match"],
		queryFn: () => getLiveMatchApi(),
	});
};

type UseLiveMatchOptions = {
	queryConfig?: QueryConfig<typeof getLiveMatchQueryOptions>;
};

export const useLiveMatch = ({ queryConfig }: UseLiveMatchOptions = {}) => {
	return useQuery({
		...getLiveMatchQueryOptions(),
		...queryConfig,
	});
};
