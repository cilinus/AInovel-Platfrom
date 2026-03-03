'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/src/stores/appStore';

// ---------------------------------------------------------------------------
// Styled Components
// ---------------------------------------------------------------------------

const FooterContainer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.muted};
  padding: 3rem 1rem 1.5rem;
`;

const FooterInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ColumnTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.75rem;
`;

const FooterLink = styled(Link)`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  line-height: 1;
  padding: 0.3125rem 0;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const BottomBar = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Copyright = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Footer() {
  const { theme, setTheme } = useAppStore();

  const handleToggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isDark = theme === 'dark';

  return (
    <FooterContainer>
      <FooterInner>
        <FooterGrid>
          <FooterColumn>
            <ColumnTitle>서비스</ColumnTitle>
            <FooterLink href="#">소개</FooterLink>
            <FooterLink href="#">이용안내</FooterLink>
            <FooterLink href="#">작가 등록</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <ColumnTitle>지원</ColumnTitle>
            <FooterLink href="#">공지사항</FooterLink>
            <FooterLink href="#">FAQ</FooterLink>
            <FooterLink href="#">문의하기</FooterLink>
          </FooterColumn>

          <FooterColumn>
            <ColumnTitle>법적 고지</ColumnTitle>
            <FooterLink href="#">이용약관</FooterLink>
            <FooterLink href="#">개인정보처리방침</FooterLink>
          </FooterColumn>
        </FooterGrid>

        <BottomBar>
          <Copyright>
            &copy; 2025 AINovel. All rights reserved.
          </Copyright>
          <ThemeToggle
            type="button"
            onClick={handleToggleTheme}
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </ThemeToggle>
        </BottomBar>
      </FooterInner>
    </FooterContainer>
  );
}
