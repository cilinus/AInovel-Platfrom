'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled, { keyframes } from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const LogoArea = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoText = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const SubTitle = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.5rem 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ApiError = styled.div`
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.destructive}10;
  border: 1px solid ${({ theme }) => theme.colors.destructive}30;
  color: ${({ theme }) => theme.colors.destructive};
  font-size: 0.875rem;
  text-align: center;
`;

const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 0.5rem;
  gap: 0.5rem;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.border};
  }
`;

const DividerText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  white-space: nowrap;
`;

const SocialButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SocialButton = styled.a<{ $bgColor: string; $textColor: string; $borderColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || 'transparent'};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

const DevAccountSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.muted};
  border: 1px dashed ${({ theme }) => theme.colors.border};
`;

const DevLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0 0 0.5rem;
`;

const DevAccountButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.375rem;
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $active, theme }) => $active ? `${theme.colors.primary}10` : theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 0.8125rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DevRole = styled.span<{ $role: string }>`
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $role }) => $role === 'AUTHOR' ? '#a855f720' : '#3b82f620'};
  color: ${({ $role }) => $role === 'AUTHOR' ? '#a855f7' : '#3b82f6'};
`;

const BottomText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-top: 1.5rem;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  text-decoration: none;
  margin-left: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.18l-.93 3.44c-.08.3.26.54.52.37l4.1-2.72c.22.02.44.03.68.03 4.42 0 8-2.79 8-6.3C17 3.79 13.42 1 9 1z"
        fill="#191919"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M12.16 9.57L5.56 1H1v16h4.84V9.43L12.44 18H17V1h-4.84v8.57z" fill="#ffffff" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { login, loading } = useLogin();
  const [apiError, setApiError] = useState<string | null>(null);

  const DEV_ACCOUNTS = [
    { email: 'reader@ainovel.com', password: 'dev', role: 'USER', label: '독자 계정' },
    { email: 'author@ainovel.com', password: 'dev', role: 'AUTHOR', label: '작가 계정' },
  ] as const;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const currentEmail = watch('email');

  const selectDevAccount = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
      router.push('/');
    } catch (e) {
      const error = e as Error;
      setApiError(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Card>
      <LogoArea>
        <LogoText>AINovel</LogoText>
        <SubTitle>로그인</SubTitle>
      </LogoArea>

      <DevAccountSection>
        <DevLabel>Dev Accounts</DevLabel>
        {DEV_ACCOUNTS.map((acc) => (
          <DevAccountButton
            key={acc.email}
            type="button"
            $active={currentEmail === acc.email}
            onClick={() => selectDevAccount(acc.email, acc.password)}
          >
            <DevRole $role={acc.role}>{acc.role}</DevRole>
            {acc.label} ({acc.email})
          </DevAccountButton>
        ))}
      </DevAccountSection>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="이메일"
          type="email"
          placeholder="이메일을 입력하세요"
          error={errors.email?.message}
          fullWidth
          autoComplete="email"
          {...register('email')}
        />

        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          error={errors.password?.message}
          fullWidth
          autoComplete="current-password"
          {...register('password')}
        />

        {apiError && <ApiError role="alert">{apiError}</ApiError>}

        <SubmitButton type="submit" variant="primary" size="lg" disabled={loading}>
          {loading && <Spinner size={18} />}
          {loading ? '로그인 중...' : '로그인'}
        </SubmitButton>
      </Form>

      <Divider>
        <DividerText>또는</DividerText>
      </Divider>

      <SocialButtons>
        <SocialButton
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api'}/auth/kakao`}
          $bgColor="#FEE500"
          $textColor="#191919"
        >
          <KakaoIcon />
          카카오로 시작하기
        </SocialButton>
        <SocialButton
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api'}/auth/naver`}
          $bgColor="#03C75A"
          $textColor="#ffffff"
        >
          <NaverIcon />
          네이버로 시작하기
        </SocialButton>
        <SocialButton
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api'}/auth/google`}
          $bgColor="#ffffff"
          $textColor="#333333"
          $borderColor="#dadce0"
        >
          <GoogleIcon />
          구글로 시작하기
        </SocialButton>
      </SocialButtons>

      <BottomText>
        계정이 없으신가요?
        <StyledLink href="/register">회원가입</StyledLink>
      </BottomText>
    </Card>
  );
}