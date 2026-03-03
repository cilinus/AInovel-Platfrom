'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, Coins, LogOut, BookOpen, PenTool } from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { useLogout } from '@/src/hooks/useAuth';
import SearchBar from '@/src/components/common/SearchBar';
import Button from '@/src/components/common/Button';

// ---------------------------------------------------------------------------
// Styled Components
// ---------------------------------------------------------------------------

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: ${({ theme }) => theme.colors.background}e6;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  height: 64px;
  gap: 1.5rem;
`;

const LogoLink = styled(Link)`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  line-height: 1;
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
  transition: color 0.2s;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const AuthArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const TokenBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  white-space: nowrap;
`;

const ProfileWrapper = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 160px;
  background-color: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 60;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const DropdownLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

// Mobile styles
const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: auto;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  background-color: rgba(0, 0, 0, 0.4);
`;

const MobilePanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
  width: 300px;
  max-width: 85vw;
  background-color: ${({ theme }) => theme.colors.background};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const MobilePanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const MobilePanelTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const MobileCloseButton = styled.button`
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
    background-color: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const MobilePanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MobileSearchWrapper = styled.div`
  margin-bottom: 0.5rem;
`;

const MobileNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const MobileNavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const MobileDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  margin: 0.5rem 0;
`;

const MobileTokenBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

const LoginButtonLink = styled(Link)`
  display: inline-flex;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Header() {
  const router = useRouter();
  // rerender-defer-reads: use selectors to avoid subscribing to entire store
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [router],
  );

  const handleLogout = useCallback(() => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [logout]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <HeaderContainer>
        <HeaderInner>
          <LogoLink href="/">AINovel</LogoLink>

          <SearchWrapper>
            <SearchBar onSearch={handleSearch} placeholder="작품 검색..." />
          </SearchWrapper>

          <DesktopNav>
            <NavLink href="/explore">탐색</NavLink>
          </DesktopNav>

          {/* Desktop auth area */}
          <AuthArea>
            {isAuthenticated && user ? (
              <>
                <TokenBadge>
                  <Coins size={16} />
                  {user.tokenBalance.toLocaleString()}
                </TokenBadge>
                <ProfileWrapper ref={dropdownRef}>
                  <ProfileButton
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-label="프로필 메뉴"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <User size={18} />
                  </ProfileButton>
                  {dropdownOpen && (
                    <Dropdown role="menu">
                      <DropdownLink
                        href="/my"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <BookOpen size={16} />
                        마이페이지
                      </DropdownLink>
                      {(user.role === 'AUTHOR' || user.role === 'ADMIN') && (
                        <DropdownLink
                          href="/author"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <PenTool size={16} />
                          작가 대시보드
                        </DropdownLink>
                      )}
                      <DropdownDivider />
                      <DropdownItem
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        로그아웃
                      </DropdownItem>
                    </Dropdown>
                  )}
                </ProfileWrapper>
              </>
            ) : (
              <LoginButtonLink href="/login">
                <Button as="span" variant="outline" size="sm">
                  로그인
                </Button>
              </LoginButtonLink>
            )}
          </AuthArea>

          {/* Mobile hamburger */}
          <MobileMenuButton
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu size={22} />
          </MobileMenuButton>
        </HeaderInner>
      </HeaderContainer>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <>
          <MobileBackdrop onClick={closeMobile} />
          <MobilePanel role="dialog" aria-modal="true" aria-label="모바일 메뉴">
            <MobilePanelHeader>
              <MobilePanelTitle>메뉴</MobilePanelTitle>
              <MobileCloseButton
                type="button"
                onClick={closeMobile}
                aria-label="메뉴 닫기"
              >
                <X size={20} />
              </MobileCloseButton>
            </MobilePanelHeader>

            <MobilePanelBody>
              <MobileSearchWrapper>
                <SearchBar
                  onSearch={(q) => {
                    handleSearch(q);
                    closeMobile();
                  }}
                  placeholder="작품 검색..."
                />
              </MobileSearchWrapper>

              <MobileNavLink href="/explore" onClick={closeMobile}>
                탐색
              </MobileNavLink>

              <MobileDivider />

              {isAuthenticated && user ? (
                <>
                  <MobileTokenBadge>
                    <Coins size={18} />
                    {user.tokenBalance.toLocaleString()} 토큰
                  </MobileTokenBadge>
                  <MobileNavLink href="/my" onClick={closeMobile}>
                    <BookOpen size={18} />
                    마이페이지
                  </MobileNavLink>
                  {(user.role === 'AUTHOR' || user.role === 'ADMIN') && (
                    <MobileNavLink href="/author" onClick={closeMobile}>
                      <PenTool size={18} />
                      작가 대시보드
                    </MobileNavLink>
                  )}
                  <MobileDivider />
                  <MobileNavButton type="button" onClick={handleLogout}>
                    <LogOut size={18} />
                    로그아웃
                  </MobileNavButton>
                </>
              ) : (
                <MobileNavLink href="/login" onClick={closeMobile}>
                  로그인
                </MobileNavLink>
              )}
            </MobilePanelBody>
          </MobilePanel>
        </>
      )}
    </>
  );
}
