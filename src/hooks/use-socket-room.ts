import { useCallback, useEffect, useRef } from "react";
import type { RoomConfig } from "@/types/socket";
import { useSocket } from "./use-socket";

export const useSocketRooms = (config: RoomConfig) => {
	const { socket, joinRoom, leaveRoom, isConnected } = useSocket();
	const joinedRooms = useRef<Set<string>>(new Set());
	const isJoining = useRef<Set<string>>(new Set());

	const safeJoinRoom = useCallback(
		async (room: string) => {
			if (joinedRooms.current.has(room) || isJoining.current.has(room)) {
				return;
			}

			isJoining.current.add(room);
			try {
				await joinRoom(room);
				joinedRooms.current.add(room);
			} catch (error) {
				console.error(`Failed to join room ${room}:`, error);
			} finally {
				isJoining.current.delete(room);
			}
		},
		[joinRoom],
	);

	const safeLeaveRoom = useCallback(
		async (room: string) => {
			if (!joinedRooms.current.has(room)) {
				return;
			}

			try {
				await leaveRoom(room);
				joinedRooms.current.delete(room);
			} catch (error) {
				console.error(`Failed to leave room ${room}:`, error);
			}
		},
		[leaveRoom],
	);

	// Auto-join user room
	useEffect(() => {
		if (config.userId && isConnected) {
			const userRoom = `user:${config.userId}`;
			safeJoinRoom(userRoom);
		}
	}, [config.userId, isConnected, safeJoinRoom]);

	// Auto-join task room
	useEffect(() => {
		if (config.taskId && isConnected) {
			const taskRoom = `task:${config.taskId}`;
			safeJoinRoom(taskRoom);
		}
	}, [config.taskId, isConnected, safeJoinRoom]);

	// Auto-join custom rooms
	useEffect(() => {
		if (config.customRooms && isConnected) {
			config.customRooms.forEach((room) => {
				safeJoinRoom(room);
			});
		}
	}, [config.customRooms, isConnected, safeJoinRoom]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			joinedRooms.current.forEach((room) => {
				safeLeaveRoom(room);
			});
			joinedRooms.current.clear();
		};
	}, [safeLeaveRoom]);

	return {
		joinRoom: safeJoinRoom,
		leaveRoom: safeLeaveRoom,
		joinedRooms: Array.from(joinedRooms.current),
		isConnected,
	};
};
