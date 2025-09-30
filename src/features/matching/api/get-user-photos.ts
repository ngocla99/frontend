import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { PhotoUpload } from "@/types/api";

export const getUserPhotosApi = (): Promise<PhotoUpload[]> => {
	return apiClient.get("/api/v1/me/faces");
};

export const getUserPhotosQueryOptions = () => {
	return queryOptions({
		queryKey: ["user-photos"],
		queryFn: () => getUserPhotosApi(),
	});
};

type UseUserPhotosOptions = {
	queryConfig?: QueryConfig<typeof getUserPhotosQueryOptions>;
};

export const useUserPhotos = ({ queryConfig }: UseUserPhotosOptions = {}) => {
	return useQuery({
		...getUserPhotosQueryOptions(),
		...queryConfig,
	});
};
