import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";

interface MatchFoundEvent {
	task_id: string;
	source_user_id: string;
	source_face_id: string;
	target_user_id: string;
	target_face_id: string;
	similarity: number;
	target_image_url: string | null;
}

interface LiveTaskDoneEvent {
	task_id: string;
	count: number;
}

export const useLiveMatches = (taskId?: string) => {
	const queryClient = useQueryClient();
	const { socket, isConnected } = useSocket();

	// Query for existing matches
	const matchesQuery = useQuery({
		queryKey: ["live-matches", taskId],
		queryFn: async () => {
			if (!taskId) return [];

			const response = await fetch(`/api/live-matches/${taskId}`);
			if (!response.ok) throw new Error("Failed to fetch matches");
			return response.json();
		},
		enabled: !!taskId,
		refetchInterval: 5000, // Refetch every 5 seconds as fallback
	});

	// Listen for real-time match events
	useEffect(() => {
		if (!socket || !isConnected || !taskId) return;

		const handleMatchFound = (data: MatchFoundEvent) => {
			if (data.task_id === taskId) {
				// Update the query cache with new match
				queryClient.setQueryData(
					["live-matches", taskId],
					(oldData: any[] = []) => {
						// Check if match already exists to avoid duplicates
						const exists = oldData.some(
							(match) =>
								match.source_face_id === data.source_face_id &&
								match.target_face_id === data.target_face_id,
						);

						if (!exists) {
							return [...oldData, data];
						}
						return oldData;
					},
				);
			}
		};

		const handleTaskDone = (data: LiveTaskDoneEvent) => {
			if (data.task_id === taskId) {
				// Invalidate and refetch to get final results
				queryClient.invalidateQueries({ queryKey: ["live-matches", taskId] });
			}
		};

		socket.on("match_found_public", handleMatchFound);
		socket.on("live_task_done", handleTaskDone);

		return () => {
			socket.off("match_found_public", handleMatchFound);
			socket.off("live_task_done", handleTaskDone);
		};
	}, [socket, isConnected, taskId, queryClient]);

	return {
		matches: matchesQuery.data || [],
		isLoading: matchesQuery.isLoading,
		error: matchesQuery.error,
		refetch: matchesQuery.refetch,
	};
};
