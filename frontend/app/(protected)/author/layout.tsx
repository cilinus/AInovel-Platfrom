'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styled from 'styled-components';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, PlusCircle, Coins } from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import Header from '@/src/components/Layout/Header';

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentRow = styled.div`
  display: flex;
  flex: 1;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
`;

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;
  padding: 1.5rem 0;
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const SidebarTitle = styled.h2`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.75rem;
  margin: 0 0 0.75rem;
`;

const SidebarLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.foreground};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background-color 0.15s, color 0.15s;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary + '10' : 'transparent'};

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MobileNav = styled.nav`
  display: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  overflow-x: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const MobileTabLink = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 9999px;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.mutedForeground};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary + '10' : 'transparent'};
  transition: all 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  padding: 1.5rem 0 1.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem 0;
  }
`;

const NAV_ITEMS = [
  { href: '/author', label: '대시보드', icon: LayoutDashboard },
  { href: '/author/works', label: '내 작품', icon: BookOpen },
  { href: '/author/works/new', label: '새 작품', icon: PlusCircle },
  { href: '/author/earnings', label: '수익 관리', icon: Coins },
];

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // rerender-defer-reads: subscribe to primitives, not the full user object
  const userRole = useAuthStore((s) => s.user?.role);
  const hasUser = useAuthStore((s) => !!s.user);

  // rerender-dependencies: use primitive deps to prevent spurious effect fires
  useEffect(() => {
    if (userRole && userRole !== 'AUTHOR' && userRole !== 'ADMIN') {
      router.replace('/my');
    }
  }, [userRole, router]);

  if (!hasUser || (userRole !== 'AUTHOR' && userRole !== 'ADMIN')) {
    return null;
  }

  return (
    <LayoutWrapper>
      <Header />
      <MobileNav>
        {NAV_ITEMS.map((item) => (
          <MobileTabLink
            key={item.href}
            href={item.href}
            $active={pathname === item.href}
          >
            <item.icon size={14} />
            {item.label}
          </MobileTabLink>
        ))}
      </MobileNav>
      <ContentRow>
        <Sidebar>
          <SidebarTitle>작가 메뉴</SidebarTitle>
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              $active={pathname === item.href}
            >
              <item.icon size={16} />
              {item.label}
            </SidebarLink>
          ))}
        </Sidebar>
        <MainContent>{children}</MainContent>
      </ContentRow>
    </LayoutWrapper>
  );
}
