import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

export function useMe() {
  const { setUser, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await apiClient.get<any>('/users/me');
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const { setAccessToken, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiClient.post<{ accessToken: string }>('/auth/login', data),
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      apiClient.setAccessToken(result.accessToken);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const { setAccessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string; nickname: string }) =>
      apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/register',
        data,
      ),
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      apiClient.setAccessToken(result.accessToken);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    logout();
    apiClient.setAccessToken(null);
    queryClient.clear();
  };
}
