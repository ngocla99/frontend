import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { ApiFnReturnType, QueryConfig } from "@/lib/react-query";

export interface GetConnectionInput {
	id: string;
}

interface ConnectionResponse {
	id: string;
	other_user: {
		id: string;
		name: string;
		profile_image: string | null;
	};
	baby_image: string | null;
	created_at: string;
}

/**
 * Fetches a single connection by ID
 */
export const getConnection = async ({
	id,
}: GetConnectionInput): Promise<ConnectionResponse> => {
	const response = await api.get<ConnectionResponse>(`/connections/${id}`);
	return response;
};

type QueryFnType = typeof getConnection;

interface UseGetConnectionOptions {
	input?: GetConnectionInput;
	queryConfig?: QueryConfig<QueryFnType>;
}

/**
 * Hook to fetch a single connection
 */
export const useGetConnection = ({
	input,
	queryConfig,
}: UseGetConnectionOptions = {}) => {
	return useQuery<ApiFnReturnType<QueryFnType>>({
		queryKey: ["connection", input?.id],
		queryFn: () => {
			if (!input) {
				throw new Error("Connection ID is required");
			}
			return getConnection(input);
		},
		enabled: !!input?.id,
		...queryConfig,
	});
};
