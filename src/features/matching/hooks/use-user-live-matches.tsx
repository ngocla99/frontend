import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from '@/hooks/use-socket';

export const useUserLiveMatches = (userId?: string) => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // Query for user's matches
  const userMatchesQuery = useQuery({
    queryKey: ['user-live-matches', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await fetch(`/api/user-matches/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user matches');
      return response.json();
    },
    enabled: !!userId,
  });

  // Listen for real-time match events for this user
  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    const handleMatchFound = (data: any) => {
      if (data.source_user_id === userId || data.target_user_id === userId) {
        // Update user matches cache
        queryClient.setQueryData(['user-live-matches', userId], (oldData: any[] = []) => {
          const exists = oldData.some(match => 
            match.source_face_id === data.source_face_id && 
            match.target_face_id === data.target_face_id
          );
          
          if (!exists) {
            return [...oldData, data];
          }
          return oldData;
        });
      }
    };

    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [socket, isConnected, userId, queryClient]);

  return {
    matches: userMatchesQuery.data || [],
    isLoading: userMatchesQuery.isLoading,
    error: userMatchesQuery.error,
    refetch: userMatchesQuery.refetch,
  };
};