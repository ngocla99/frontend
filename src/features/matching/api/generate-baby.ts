import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

// API Functions
export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
  // return apiClient.post(`/api/v1/baby?match_id=${matchId}`);
  return apiClient.post(`/api/v1/baby`, { match_id: matchId });
};

export const getBabyForMatchApi = (
  matchId: string,
  signal?: AbortSignal
): Promise<BabyApi> => {
  return apiClient.get(`/api/v1/baby?match_id=${matchId}`, { signal });
};

// Query Options
export const getBabyForMatchQueryOptions = (matchId: string) => {
  return queryOptions({
    queryKey: ["baby", "match", matchId],
    queryFn: ({ signal }) => getBabyForMatchApi(matchId, signal),
    enabled: !!matchId,
    retry: false, // Don't retry if baby doesn't exist yet
  });
};

// Hooks
type UseBabyForMatchOptions = {
  matchId?: string;
  queryConfig?: QueryConfig<typeof getBabyForMatchQueryOptions>;
};

export const useBabyForMatch = ({
  matchId,
  queryConfig,
}: UseBabyForMatchOptions = {}) => {
  return useQuery({
    ...getBabyForMatchQueryOptions(matchId || ""),
    ...queryConfig,
  });
};

export const useGenerateBaby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBabyApi,
    onSuccess: (data, matchId) => {
      // Update the cache with the new baby
      queryClient.setQueryData(["baby", "match", matchId], data);
      // Invalidate baby list queries if they exist
      queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
    },
  });
};
