'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../src/lib/api';
import { useAuthStore } from '../../../src/stores/authStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  background-color: ${({ theme }) => theme.colors.muted};
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
  color: ${({ theme }) => theme.colors.primary};
`;

const Message = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

function mapApiUser(raw: any) {
  return {
    id: raw._id ?? raw.id,
    email: raw.email,
    nickname: raw.nickname,
    profileImage: raw.profileImage,
    role: (raw.role ?? 'user').toUpperCase(),
    tokenBalance: raw.tokenBalance ?? 0,
    bio: raw.bio,
    createdAt: raw.createdAt,
  };
}

function LoadingFallback() {
  return (
    <Container>
      <Spinner size={32} />
      <Message>로그인 처리 중...</Message>
    </Container>
  );
}

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didProcess = useRef(false);

  useEffect(() => {
    if (didProcess.current) return;
    didProcess.current = true;

    const token = searchParams.get('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        useAuthStore.getState().setAccessToken(token);
        apiClient.setAccessToken(token);

        const user = await apiClient.get<any>('/users/me');
        useAuthStore.getState().setUser(mapApiUser(user));

        router.replace('/');
      } catch {
        useAuthStore.getState().logout();
        apiClient.setAccessToken(null);
        router.replace('/login');
      }
    })();
  }, [router, searchParams]);

  return <LoadingFallback />;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
