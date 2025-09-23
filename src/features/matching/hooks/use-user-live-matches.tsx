import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import type { UserMatchApi } from "@/types/api";
import { useUserMatch } from "../api/get-user-match";
import type { UniversityMatch } from "../components/user-match/university-match-tab";
import { transformApiUserMatchToDisplayData } from "../utils/transform-api-data";

export const useUserLiveMatches = () => {
	const queryClient = useQueryClient();
	const { socket, isConnected } = useSocket();

	const { data: userMatches, isLoading, error } = useUserMatch();

	// Listen for real-time match events for this user
	useEffect(() => {
		if (!socket || !isConnected) return;

		const handleMatchFound = (data: UserMatchApi) => {
			// Update user matches cache
			queryClient.setQueryData(
				["user-live-matches"],
				(oldData: UniversityMatch[] = []) => {
					// const exists = oldData.some(
					// 	(match) => match.target_face_id === data.target_face_id,
					// );
					const transformedData = transformApiUserMatchToDisplayData(data);

					// if (!exists) {
					// 	return [...oldData, transformedData];
					// }

					return [...oldData, transformedData];
				},
			);
		};

		socket.on("match_found", handleMatchFound);

		return () => {
			socket.off("match_found", handleMatchFound);
		};
	}, [socket, isConnected, queryClient]);

	return {
		matches: userMatches || [],
		isLoading: isLoading,
		error: error,
	};
};
