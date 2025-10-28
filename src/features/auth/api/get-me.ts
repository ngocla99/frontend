import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { UserApi } from "@/types/api";

export const getMeApi = async (): Promise<UserApi> => {
  return api.get<UserApi>("/auth/me");
};

export const getMeQueryOptions = () => {
  return queryOptions({
    queryKey: ["auth", "me"],
    queryFn: () => getMeApi(),
    staleTime: 10 * 60 * 1000, // 5 minutes
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

export const useUser = () => {
  const { data } = useMe();
  return data;
};
