import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";

export const getFacesApi = (): Promise<any> => {
	return apiClient.get("/api/v1/me/faces");
};

export const getFacesQueryOptions = () => {
	return queryOptions({
		queryKey: ["faces"],
		queryFn: () => getFacesApi(),
	});
};

type UseFacesOptions = {
	queryConfig?: QueryConfig<typeof getFacesQueryOptions>;
};

export const useFaces = ({ queryConfig }: UseFacesOptions = {}) => {
	return useQuery({
		...getFacesQueryOptions(),
		...queryConfig,
	});
};
