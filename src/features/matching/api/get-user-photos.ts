import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { UserPhotosResponse } from "@/types/api";

export const getUserPhotosApi = async (): Promise<UserPhotosResponse> => {
	const response = await api.get<{ faces: any[]; total: number }>("/faces");
	return {
		faces: response.faces,
		number_of_faces: response.total,
	};
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
