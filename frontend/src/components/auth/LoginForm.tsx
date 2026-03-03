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

const SocialButton = styled.button<{ $bgColor: string; $textColor: string; $borderColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || 'transparent'};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.6;
  transition: opacity 0.2s;
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
        <SocialButton $bgColor="#FEE500" $textColor="#191919" disabled>
          카카오로 시작하기
        </SocialButton>
        <SocialButton $bgColor="#03C75A" $textColor="#ffffff" disabled>
          네이버로 시작하기
        </SocialButton>
        <SocialButton $bgColor="#ffffff" $textColor="#333333" $borderColor="#dadce0" disabled>
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