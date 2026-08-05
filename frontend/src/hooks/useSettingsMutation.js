import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import toast from 'react-hot-toast';

export function useSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch) => client('/auth/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

    onMutate: async (patch) => {
      // Cancel outgoing queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['me'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['me']);
      
      // Optimistically update
      queryClient.setQueryData(['me'], (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, ...patch },
        };
      });

      // Return context with snapshotted value
      return { previous };
    },

    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previous) {
        queryClient.setQueryData(['me'], context.previous);
      }
      toast.error('Setting not saved — check your connection');
    },

    onSettled: () => {
      // Always refetch after error or success to sync with server state
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
