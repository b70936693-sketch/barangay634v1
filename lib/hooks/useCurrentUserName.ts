import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from './useSupabaseSession';
import { getCurrentPortalUser } from '@/lib/backend/auth';

export function useCurrentUserName() {
  const { session } = useSupabaseSession();

  return useQuery({
    queryKey: ['current-user-name'],
    queryFn: async () => {
      if (!session?.access_token) return null;

      const response = await fetch('/api/portal/auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.portalUser?.fullName || 
             session.user?.user_metadata?.full_name || 
             session.user?.email?.split('@')[0] || 
             'User';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session?.access_token,
  });
}
