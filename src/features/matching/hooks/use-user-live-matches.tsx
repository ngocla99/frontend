import { useUserMatch } from "../api/get-user-match";

export const useUserMatches = (userId?: string, faceId?: string | null) => {
	const {
		data: userMatches,
		isLoading,
		error,
	} = useUserMatch({
		input: faceId ? { face_id: faceId, limit: 50, offset: 0 } : undefined,
		queryConfig: {
			enabled: !!faceId,
		},
	});

	return {
		matches: userMatches || [],
		isLoading: isLoading,
		error: error,
	};
};
