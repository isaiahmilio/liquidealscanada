import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

interface FavoriteEntry { listingId: string }
interface FavoritesResponse { favorites: FavoriteEntry[] }

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  const { data } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<FavoritesResponse>('/api/favorites'),
    enabled: !!user,
    staleTime: 30_000,
  });

  const favoriteIds = new Set((data?.favorites ?? []).map((f) => f.listingId));

  const mutation = useMutation({
    mutationFn: (listingId: string) =>
      favoriteIds.has(listingId)
        ? api.del(`/api/favorites/${listingId}`)
        : api.post(`/api/favorites/${listingId}`),
    onMutate: async (listingId) => {
      await qc.cancelQueries({ queryKey: ['favorites'] });
      const prev = qc.getQueryData<FavoritesResponse>(['favorites']);
      qc.setQueryData<FavoritesResponse>(['favorites'], (old) => {
        if (!old) return old;
        if (favoriteIds.has(listingId)) {
          return { favorites: old.favorites.filter((f) => f.listingId !== listingId) };
        }
        return { favorites: [...old.favorites, { listingId }] };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites'], ctx.prev);
      toast.error('Could not update saved items');
    },
    onSettled: (_data, err, listingId) => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      if (!err) {
        const current = qc.getQueryData<{ favorites: { listingId: string }[] }>(['favorites']);
        const nowSaved = current?.favorites.some((f) => f.listingId === listingId);
        toast.success(nowSaved ? 'Saved!' : 'Removed from saved');
      }
    },
  });

  return {
    isFavorited: (id: string) => favoriteIds.has(id),
    toggle: (id: string) => { if (user) mutation.mutate(id); },
  };
}
