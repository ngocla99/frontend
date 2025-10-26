import { useCelebMatch } from "../api/get-celeb-match";

export const useCelebMatches = (
	userId?: string,
	faceId?: string | null,
) => {
	const {
		data: celebMatches,
		isLoading,
		error,
	} = useCelebMatch({
		input: faceId ? { face_id: faceId, limit: 50, offset: 0 } : undefined,
		queryConfig: {
			enabled: !!faceId,
		},
	});

	return {
		matches: celebMatches || [],
		isLoading: isLoading,
		error: error,
	};
};
