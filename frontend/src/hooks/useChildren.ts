import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { childService, type CreateChildPayload } from '@/services/child.service';
import { useAuthContext } from '@/context/AuthContext';

export const useChildren = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthContext();

  const childrenQuery = useQuery({
    queryKey: ['children'],
    queryFn: childService.list,
    enabled: isAuthenticated,
  });

  const createChildMutation = useMutation({
    mutationFn: (payload: CreateChildPayload) => childService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });

  return {
    children: childrenQuery.data ?? [],
    isLoading: childrenQuery.isLoading,
    isFetching: childrenQuery.isFetching,
    error: childrenQuery.error instanceof Error ? childrenQuery.error.message : null,
    refetch: childrenQuery.refetch,
    createChild: createChildMutation.mutateAsync,
    isCreating: createChildMutation.isPending,
    createError:
      createChildMutation.error instanceof Error
        ? createChildMutation.error.message
        : null,
  };
};
