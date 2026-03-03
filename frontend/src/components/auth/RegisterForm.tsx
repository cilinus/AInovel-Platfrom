'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled, { keyframes } from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';

const registerSchema = z
  .object({
    nickname: z
      .string()
      .min(2, '닉네임은 2자 이상이어야 합니다')
      .max(20, '닉네임은 20자 이하여야 합니다'),
    email: z.string().email('올바른 이메일을 입력하세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

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

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, loading } = useRegister();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
      });
      router.push('/');
    } catch (e) {
      const error = e as Error;
      setApiError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Card>
      <LogoArea>
        <LogoText>AINovel</LogoText>
        <SubTitle>회원가입</SubTitle>
      </LogoArea>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="닉네임"
          type="text"
          placeholder="닉네임을 입력하세요"
          error={errors.nickname?.message}
          fullWidth
          autoComplete="nickname"
          {...register('nickname')}
        />

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
          placeholder="8자 이상 입력하세요"
          error={errors.password?.message}
          fullWidth
          autoComplete="new-password"
          {...register('password')}
        />

        <Input
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          error={errors.confirmPassword?.message}
          fullWidth
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        {apiError && <ApiError role="alert">{apiError}</ApiError>}

        <SubmitButton type="submit" variant="primary" size="lg" disabled={loading}>
          {loading && <Spinner size={18} />}
          {loading ? '가입 중...' : '회원가입'}
        </SubmitButton>
      </Form>

      <BottomText>
        이미 계정이 있으신가요?
        <StyledLink href="/login">로그인</StyledLink>
      </BottomText>
    </Card>
  );
}