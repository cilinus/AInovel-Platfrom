'use client';

import styled from 'styled-components';

const AuthContainer = styled.div`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.muted};
`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthContainer>{children}</AuthContainer>;
}
