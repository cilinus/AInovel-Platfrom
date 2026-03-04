'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Coins, TrendingUp, ArrowDownToLine, Calendar, Sun, Banknote, Wallet } from 'lucide-react';
import { usePayments, EarningsSummaryItem } from '@/src/hooks/usePayments';
import { useAuthStore } from '@/src/stores/authStore';
import Loading from '@/src/components/common/Loading';
import Button from '@/src/components/common/Button';
import CashoutModal from '@/src/components/payments/CashoutModal';

// --- Styled ---

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SummaryLabel = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const SummaryValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
`;

const SummaryUnit = styled.span`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-left: 0.25rem;
`;

const DeltaBadge = styled.span<{ $positive: boolean; $zero: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $positive, $zero, theme }) =>
    $zero
      ? theme.colors.mutedForeground
      : $positive
        ? theme.colors.accent
        : theme.colors.destructive};
`;

const ControlBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ControlLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ToggleGroup = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.card};
  color: ${({ $active, theme }) =>
    $active ? '#ffffff' : theme.colors.foreground};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const DateInput = styled.input`
  padding: 0.5rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 0.8125rem;
`;

const DateSeparator = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const TableWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: ${({ theme }) => theme.colors.muted};
`;

const Th = styled.th<{ $align?: string }>`
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: ${({ $align }) => $align ?? 'left'};
  white-space: nowrap;
`;

const Td = styled.td<{ $align?: string }>`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  text-align: ${({ $align }) => $align ?? 'left'};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const AmountCell = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 3rem 1rem;
`;

const TotalRow = styled.tr`
  background-color: ${({ theme }) => theme.colors.muted};
  font-weight: 600;
`;

const ErrorBanner = styled.div`
  padding: 0.875rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.destructive};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.destructive}10;
  color: ${({ theme }) => theme.colors.destructive};
  font-size: 0.875rem;
`;

// --- Helper ---

function formatPeriodLabel(period: string, groupBy: 'daily' | 'hourly'): string {
  if (groupBy === 'hourly') {
    // "2026-03-03 14:00" -> "03/03 14:00"
    const [date, time] = period.split(' ');
    const [, m, d] = date.split('-');
    return `${m}/${d} ${time}`;
  }
  // "2026-03-03" -> "2026-03-03 (월)"
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dt = new Date(period + 'T00:00:00');
  const dayName = dayNames[dt.getDay()];
  return `${period} (${dayName})`;
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

// --- Component ---

export default function AuthorEarningsContent() {
  const user = useAuthStore((s) => s.user);
  const updateTokenBalance = useAuthStore((s) => s.updateTokenBalance);
  const { getAuthorEarnings, getEarningsSummary } = usePayments();

  const [groupBy, setGroupBy] = useState<'daily' | 'hourly'>('daily');
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    totalWithdrawn: 0,
    todayEarned: 0,
    yesterdayEarned: 0,
    todayWithdrawnTokens: 0,
    yesterdayWithdrawnTokens: 0,
    tokenBalance: 0,
    krwBalance: 0,
    withdrawalRate: 0.9,
  });
  const [summaryItems, setSummaryItems] = useState<EarningsSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cashoutOpen, setCashoutOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [earningsData, summary] = await Promise.all([
        getAuthorEarnings(),
        getEarningsSummary(groupBy, startDate, endDate),
      ]);
      setEarnings({
        totalEarned: earningsData.totalEarned,
        totalWithdrawn: earningsData.totalWithdrawn,
        todayEarned: earningsData.todayEarned,
        yesterdayEarned: earningsData.yesterdayEarned,
        todayWithdrawnTokens: earningsData.todayWithdrawnTokens,
        yesterdayWithdrawnTokens: earningsData.yesterdayWithdrawnTokens,
        tokenBalance: earningsData.tokenBalance,
        krwBalance: earningsData.krwBalance,
        withdrawalRate: earningsData.withdrawalRate,
      });
      setSummaryItems(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '수익 데이터를 불러오지 못했습니다.';
      console.error('[AuthorEarnings] fetchData error:', err);
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [getAuthorEarnings, getEarningsSummary, groupBy, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const grandTotal = summaryItems.reduce((s, i) => s + i.totalAmount, 0);
  const grandCount = summaryItems.reduce((s, i) => s + i.count, 0);

  if (!user) return null;

  return (
    <PageWrapper>
      <PageTitle>수익 관리</PageTitle>

      {fetchError && <ErrorBanner>{fetchError}</ErrorBanner>}

      {loading && !summaryItems.length ? (
        <Loading />
      ) : (
        <>
          <SummaryGrid>
            <SummaryCard>
              <SummaryLabel>
                <TrendingUp size={14} />
                총 수익
              </SummaryLabel>
              <div>
                <SummaryValue>{earnings.totalEarned.toLocaleString()}</SummaryValue>
                <SummaryUnit>토큰</SummaryUnit>
              </div>
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>
                <Sun size={14} />
                오늘 수익
              </SummaryLabel>
              <div>
                <SummaryValue>{earnings.todayEarned.toLocaleString()}</SummaryValue>
                <SummaryUnit>토큰</SummaryUnit>
              </div>
              {(() => {
                const diff = earnings.todayEarned - earnings.yesterdayEarned;
                const isZero = diff === 0;
                const isPositive = diff > 0;
                return (
                  <DeltaBadge $positive={isPositive} $zero={isZero}>
                    {isZero ? '- ' : isPositive ? '+ ' : '- '}
                    어제 대비 {isZero ? '변동 없음' : `${Math.abs(diff).toLocaleString()} 토큰`}
                  </DeltaBadge>
                );
              })()}
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>
                <ArrowDownToLine size={14} />
                총 출금
              </SummaryLabel>
              <div>
                <SummaryValue>{earnings.totalWithdrawn.toLocaleString()}</SummaryValue>
                <SummaryUnit>토큰</SummaryUnit>
              </div>
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>
                <Banknote size={14} />
                오늘 환전
              </SummaryLabel>
              <div>
                <SummaryValue>
                  {Math.floor(earnings.todayWithdrawnTokens * earnings.withdrawalRate).toLocaleString()}
                </SummaryValue>
                <SummaryUnit>원</SummaryUnit>
              </div>
              {(() => {
                const todayKRW = Math.floor(earnings.todayWithdrawnTokens * earnings.withdrawalRate);
                const yesterdayKRW = Math.floor(earnings.yesterdayWithdrawnTokens * earnings.withdrawalRate);
                const diff = todayKRW - yesterdayKRW;
                const isZero = diff === 0;
                const isPositive = diff > 0;
                return (
                  <DeltaBadge $positive={isPositive} $zero={isZero}>
                    {isZero ? '- ' : isPositive ? '+ ' : '- '}
                    어제 대비 {isZero ? '변동 없음' : `${Math.abs(diff).toLocaleString()}원`}
                  </DeltaBadge>
                );
              })()}
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>
                <Coins size={14} />
                보유 토큰
              </SummaryLabel>
              <div>
                <SummaryValue>
                  {earnings.tokenBalance.toLocaleString()}
                </SummaryValue>
                <SummaryUnit>토큰</SummaryUnit>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCashoutOpen(true)}
              >
                정산하기
              </Button>
            </SummaryCard>
            <SummaryCard>
              <SummaryLabel>
                <Wallet size={14} />
                보유 원화
              </SummaryLabel>
              <div>
                <SummaryValue>
                  {earnings.krwBalance.toLocaleString()}
                </SummaryValue>
                <SummaryUnit>원</SummaryUnit>
              </div>
            </SummaryCard>
          </SummaryGrid>

          <ControlBar>
            <ControlLeft>
              <ToggleGroup>
                <ToggleButton
                  $active={groupBy === 'daily'}
                  onClick={() => setGroupBy('daily')}
                >
                  일자별
                </ToggleButton>
                <ToggleButton
                  $active={groupBy === 'hourly'}
                  onClick={() => setGroupBy('hourly')}
                >
                  시간별
                </ToggleButton>
              </ToggleGroup>
              <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
              <DateInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <DateSeparator>~</DateSeparator>
              <DateInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </ControlLeft>
          </ControlBar>

          {summaryItems.length === 0 ? (
            <EmptyText>해당 기간에 수익 내역이 없습니다.</EmptyText>
          ) : (
            <TableWrapper>
              <Table>
                <Thead>
                  <tr>
                    <Th>{groupBy === 'daily' ? '날짜' : '시간대'}</Th>
                    <Th $align="right">건수</Th>
                    <Th $align="right">수익 (토큰)</Th>
                  </tr>
                </Thead>
                <tbody>
                  {summaryItems.map((item) => (
                    <tr key={item.period}>
                      <Td>{formatPeriodLabel(item.period, groupBy)}</Td>
                      <Td $align="right">{item.count.toLocaleString()}</Td>
                      <Td $align="right">
                        <AmountCell>
                          +{item.totalAmount.toLocaleString()}
                        </AmountCell>
                      </Td>
                    </tr>
                  ))}
                  <TotalRow>
                    <Td>합계</Td>
                    <Td $align="right">{grandCount.toLocaleString()}</Td>
                    <Td $align="right">
                      <AmountCell>
                        +{grandTotal.toLocaleString()}
                      </AmountCell>
                    </Td>
                  </TotalRow>
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </>
      )}

      <CashoutModal
        isOpen={cashoutOpen}
        onClose={() => setCashoutOpen(false)}
        onSuccess={(balance) => {
          updateTokenBalance(balance);
          fetchData();
        }}
      />
    </PageWrapper>
  );
}
