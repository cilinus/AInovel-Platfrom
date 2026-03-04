'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import {
  User,
  Coins,
  BookOpen,
  Bookmark,
  Receipt,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { apiClient } from '@/src/lib/api';
import { formatNumber, formatDate, toImageUrl } from '@/src/lib/utils';
import Badge from '@/src/components/common/Badge';
import Button from '@/src/components/common/Button';
import Loading from '@/src/components/common/Loading';
import ChargeModal from '@/src/components/payments/ChargeModal';
import CashoutModal from '@/src/components/payments/CashoutModal';
import WorkCard from '@/src/components/works/WorkCard';
import type { Work } from '@/src/types/work';

// --- Types for API responses ---
interface ReadingHistoryItem {
  workId: string;
  lastEpisodeId: string;
  lastEpisodeNumber: number;
  progress: number;
  lastReadAt: string;
}

interface ApiWork {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  genre: string;
  tags?: string[];
  status?: string;
  contentType?: string;
  isAiGenerated?: boolean;
  episodeCount?: number;
  stats?: {
    viewCount?: number;
    likeCount?: number;
    bookmarkCount?: number;
    averageRating?: number;
    ratingCount?: number;
  };
  authorId?: { nickname: string; profileImage?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

interface PurchaseItem {
  id: string;
  workId: string;
  workTitle: string;
  episodeId: string;
  episodeTitle: string;
  price: number;
  purchasedAt: string;
}

function mapApiWork(api: ApiWork): Work {
  const authorName =
    typeof api.authorId === 'string'
      ? api.authorId
      : api.authorId?.nickname ?? '';
  return {
    id: api._id,
    authorId: authorName,
    title: api.title,
    synopsis: api.description ?? '',
    coverImageUrl: toImageUrl(api.coverImage),
    genre: api.genre as Work['genre'],
    subGenres: [],
    tags: api.tags ?? [],
    status: (api.status as Work['status']) ?? 'DRAFT',
    isAiGenerated: api.isAiGenerated ?? false,
    contentType: (api.contentType as Work['contentType']) ?? 'HUMAN',
    totalEpisodes: api.episodeCount ?? 0,
    freeEpisodeCount: 0,
    pricePerEpisode: 0,
    viewCount: api.stats?.viewCount ?? 0,
    likeCount: api.stats?.likeCount ?? 0,
    bookmarkCount: api.stats?.bookmarkCount ?? 0,
    rating: api.stats?.averageRating ?? 0,
    ratingCount: api.stats?.ratingCount ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

// --- Role labels ---
const ROLE_LABELS: Record<string, string> = {
  USER: '일반 회원',
  AUTHOR: '작가',
  ADMIN: '관리자',
};

// --- Genre gradient for reading history thumbnails ---
const GENRE_GRADIENTS: Record<string, string> = {
  ROMANCE: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  FANTASY: 'linear-gradient(135deg, #a855f7, #6366f1)',
  MARTIAL_ARTS: 'linear-gradient(135deg, #f59e0b, #f97316)',
  MODERN: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
  MYSTERY: 'linear-gradient(135deg, #64748b, #6b7280)',
  SF: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
};

// ======= Styled Components =======

const PageWrapper = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

// --- Top Cards ---
const TopCards = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
`;

const ProfileCard = styled(Card)`
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
`;

const AvatarCircle = styled.div`
  flex-shrink: 0;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const Nickname = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Email = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.25rem 0 0;
`;

const Bio = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0.5rem 0 0;
  line-height: 1.5;
`;

const JoinDate = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.5rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TokenCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
`;

const TokenIcon = styled.div`
  color: ${({ theme }) => theme.colors.accent};
`;

const TokenLabel = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const TokenValue = styled.span`
  font-size: 2.25rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.accent};
  line-height: 1;
`;

const TokenUnit = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-left: 0.25rem;
`;

// --- Section ---
const Section = styled.section``;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SeeAllLink = styled(Link)`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

// --- Reading History ---
const HistoryScroll = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`;

const HistoryCard = styled(Link)`
  flex-shrink: 0;
  width: 260px;
  scroll-snap-align: start;
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.card};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const HistoryThumb = styled.div<{ $gradient: string }>`
  flex-shrink: 0;
  width: 48px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $gradient }) => $gradient};
  overflow: hidden;
`;

const HistoryThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HistoryInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
`;

const HistoryTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryEpisode = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const ProgressBarBg = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: 2px;
  margin-top: 0.25rem;
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
  transition: width 0.3s;
`;

// --- Bookmarks Scroll ---
const BookmarksScroll = styled.div`
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 2px;
  }
`;

// --- Purchases ---
const PurchaseList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const PurchaseRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background-color 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const PurchaseInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const PurchaseWorkTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PurchaseEpTitle = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const PurchaseRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  flex-shrink: 0;
`;

const PurchasePrice = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

const PurchaseDate = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 2rem;
`;

// ======= Component =======

export default function MyPageContent() {
  const user = useAuthStore((s) => s.user);
  const updateTokenBalance = useAuthStore((s) => s.updateTokenBalance);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [cashoutOpen, setCashoutOpen] = useState(false);

  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [historyWorks, setHistoryWorks] = useState<Map<string, Work>>(new Map());
  const [bookmarkWorks, setBookmarkWorks] = useState<Work[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, bookmarksRes, purchasesRes] = await Promise.all([
        apiClient.get<ReadingHistoryItem[]>('/users/me/reading-history'),
        apiClient.get<{ items: ApiWork[]; total: number }>('/users/me/bookmarks'),
        apiClient.get<{ items: PurchaseItem[]; total: number }>('/users/me/purchases'),
      ]);

      setReadingHistory(historyRes);

      // Build work map for reading history - fetch each work referenced
      const workIds = historyRes.map((h) => h.workId);
      const uniqueWorkIds = [...new Set(workIds)];
      const workMap = new Map<string, Work>();
      // Try to get works from the bookmarks response first, then fetch individually
      const allApiWorks = bookmarksRes.items;
      for (const aw of allApiWorks) {
        workMap.set(aw._id, mapApiWork(aw));
      }
      // For any missing works in history, fetch them
      for (const wId of uniqueWorkIds) {
        if (!workMap.has(wId)) {
          try {
            const w = await apiClient.get<ApiWork>(`/works/${wId}`);
            workMap.set(w._id, mapApiWork(w));
          } catch {
            // skip
          }
        }
      }
      setHistoryWorks(workMap);
      setBookmarkWorks(bookmarksRes.items.map(mapApiWork));
      setPurchases(purchasesRes.items);
    } catch {
      // silent fail for mock
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;
  if (loading) return <PageWrapper><Loading /></PageWrapper>;

  const joinDate = user.createdAt
    ? new Date(user.createdAt as string).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <PageWrapper>
      {/* Profile + Token */}
      <TopCards>
        <ProfileCard>
          <AvatarCircle>
            <User size={28} />
          </AvatarCircle>
          <ProfileInfo>
            <Nickname>
              {user.nickname}
              <Badge color={user.role === 'AUTHOR' ? '#8b5cf6' : undefined}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </Nickname>
            <Email>{user.email ?? ''}</Email>
            {user.bio && <Bio>{user.bio}</Bio>}
            {joinDate && (
              <JoinDate>
                <Clock size={12} />
                {joinDate} 가입
              </JoinDate>
            )}
          </ProfileInfo>
        </ProfileCard>

        <TokenCard>
          <TokenIcon>
            <Coins size={36} />
          </TokenIcon>
          <TokenLabel>보유 토큰</TokenLabel>
          <div>
            <TokenValue>{user.tokenBalance.toLocaleString()}</TokenValue>
            <TokenUnit>토큰</TokenUnit>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" size="sm" onClick={() => setChargeOpen(true)}>
              충전하기
            </Button>
            {user.role === 'AUTHOR' && (
              <Button variant="outline" size="sm" onClick={() => setCashoutOpen(true)}>
                정산하기
              </Button>
            )}
          </div>
        </TokenCard>
      </TopCards>

      {/* Reading History */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <BookOpen size={18} />
            내 서재
          </SectionTitle>
        </SectionHeader>
        {readingHistory.length === 0 ? (
          <EmptyText>아직 읽은 작품이 없습니다.</EmptyText>
        ) : (
          <HistoryScroll>
            {readingHistory.map((item) => {
              const work = historyWorks.get(item.workId);
              if (!work) return null;
              const gradient = GENRE_GRADIENTS[work.genre] ?? GENRE_GRADIENTS.MODERN;
              return (
                <HistoryCard
                  key={item.workId}
                  href={`/works/${work.id}/episodes/${item.lastEpisodeId}`}
                >
                  <HistoryThumb $gradient={gradient}>
                    {work.coverImageUrl && (
                      <HistoryThumbImg src={work.coverImageUrl} alt={work.title} />
                    )}
                  </HistoryThumb>
                  <HistoryInfo>
                    <HistoryTitle>{work.title}</HistoryTitle>
                    <HistoryEpisode>
                      {item.lastEpisodeNumber}화까지 읽음
                    </HistoryEpisode>
                    <ProgressBarBg>
                      <ProgressBarFill $percent={item.progress} />
                    </ProgressBarBg>
                  </HistoryInfo>
                </HistoryCard>
              );
            })}
          </HistoryScroll>
        )}
      </Section>

      {/* Bookmarks */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <Bookmark size={18} />
            북마크한 작품
          </SectionTitle>
        </SectionHeader>
        {bookmarkWorks.length === 0 ? (
          <EmptyText>북마크한 작품이 없습니다.</EmptyText>
        ) : (
          <BookmarksScroll>
            {bookmarkWorks.map((work) => (
              <WorkCard key={work.id} work={work} variant="compact" />
            ))}
          </BookmarksScroll>
        )}
      </Section>

      {/* Purchases */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <Receipt size={18} />
            구매 내역
          </SectionTitle>
        </SectionHeader>
        {purchases.length === 0 ? (
          <EmptyText>구매 내역이 없습니다.</EmptyText>
        ) : (
          <PurchaseList>
            {purchases.map((p) => (
              <PurchaseRow key={p.id} href={`/works/${p.workId}`}>
                <PurchaseInfo>
                  <PurchaseWorkTitle>{p.workTitle}</PurchaseWorkTitle>
                  <PurchaseEpTitle>{p.episodeTitle}</PurchaseEpTitle>
                </PurchaseInfo>
                <PurchaseRight>
                  <PurchasePrice>{p.price} 토큰</PurchasePrice>
                  <PurchaseDate>{formatDate(p.purchasedAt)}</PurchaseDate>
                </PurchaseRight>
              </PurchaseRow>
            ))}
          </PurchaseList>
        )}
      </Section>
      <ChargeModal
        isOpen={chargeOpen}
        onClose={() => setChargeOpen(false)}
        onSuccess={(balance) => updateTokenBalance(balance)}
      />
      {user.role === 'AUTHOR' && (
        <CashoutModal
          isOpen={cashoutOpen}
          onClose={() => setCashoutOpen(false)}
          onSuccess={(balance) => updateTokenBalance(balance)}
        />
      )}
    </PageWrapper>
  );
}