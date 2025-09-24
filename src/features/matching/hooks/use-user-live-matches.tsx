import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import type { UserMatchApi } from "@/types/api";
import { getUserMatchQueryOptions, useUserMatch } from "../api/get-user-match";

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
				getUserMatchQueryOptions().queryKey,
				(oldData: UserMatchApi[] | undefined) => {
					if (!oldData) return [data];
					return [data, ...oldData];
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
