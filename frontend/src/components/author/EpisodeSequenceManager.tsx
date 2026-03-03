'use client';

import { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import Button from '@/src/components/common/Button';

interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  isPublished: boolean;
  wordCount?: number;
}

interface EpisodeSequenceManagerProps {
  workId: string;
  episodes: EpisodeItem[];
  onSave: (orders: { episodeId: string; episodeNumber: number }[]) => Promise<void>;
  onInsert: (position: number) => void;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const EpisodeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const InsertSlot = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.25rem 0;
  border: 1px dashed transparent;
  background: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  transition: all 0.2s;
  border-radius: ${({ theme }) => theme.radius.sm};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}08;
  }
`;

const Row = styled.div<{ $changed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ $changed, theme }) =>
    $changed ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $changed, theme }) =>
    $changed ? `${theme.colors.primary}06` : theme.colors.background};
  transition: border-color 0.2s, background-color 0.2s;
`;

const NumberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 1.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary}12;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const TitleText = styled.span`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span<{ $published: boolean }>`
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  color: ${({ $published, theme }) =>
    $published ? theme.colors.primary : theme.colors.mutedForeground};
  background-color: ${({ $published, theme }) =>
    $published ? `${theme.colors.primary}12` : theme.colors.muted};
`;

const WordCountText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const MoveButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const MoveButton = styled.button<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: none;
  color: ${({ $disabled, theme }) =>
    $disabled ? theme.colors.muted : theme.colors.foreground};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.15s;
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function EpisodeSequenceManager({
  workId,
  episodes: initialEpisodes,
  onSave,
  onInsert,
}: EpisodeSequenceManagerProps) {
  const [orderedEpisodes, setOrderedEpisodes] = useState<EpisodeItem[]>(() =>
    [...initialEpisodes].sort((a, b) => a.number - b.number),
  );
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    const sorted = [...initialEpisodes].sort((a, b) => a.number - b.number);
    return orderedEpisodes.some(
      (ep, i) => ep.id !== sorted[i]?.id,
    );
  }, [orderedEpisodes, initialEpisodes]);

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setOrderedEpisodes((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setOrderedEpisodes((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const orders = orderedEpisodes.map((ep, i) => ({
        episodeId: ep.id,
        episodeNumber: i + 1,
      }));
      await onSave(orders);
    } finally {
      setSaving(false);
    }
  }, [orderedEpisodes, onSave]);

  const handleCancel = useCallback(() => {
    setOrderedEpisodes(
      [...initialEpisodes].sort((a, b) => a.number - b.number),
    );
  }, [initialEpisodes]);

  return (
    <Wrapper>
      <TopActions>
        <Button
          variant="primary"
          size="sm"
          disabled={!hasChanges || saving}
          onClick={handleSave}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasChanges || saving}
          onClick={handleCancel}
        >
          취소
        </Button>
      </TopActions>

      <EpisodeList>
        <InsertSlot onClick={() => onInsert(1)}>
          <Plus size={12} /> 여기에 삽입
        </InsertSlot>

        {orderedEpisodes.map((ep, index) => {
          const originalSorted = [...initialEpisodes].sort(
            (a, b) => a.number - b.number,
          );
          const isChanged = ep.id !== originalSorted[index]?.id;

          return (
            <div key={ep.id}>
              <Row $changed={isChanged}>
                <NumberBadge>{index + 1}</NumberBadge>
                <TitleText>{ep.title}</TitleText>
                <StatusBadge $published={ep.isPublished}>
                  {ep.isPublished ? '공개' : '비공개'}
                </StatusBadge>
                {ep.wordCount !== undefined && (
                  <WordCountText>{ep.wordCount}자</WordCountText>
                )}
                <MoveButtons>
                  <MoveButton
                    $disabled={index === 0}
                    onClick={() => moveUp(index)}
                    aria-label="위로 이동"
                  >
                    <ArrowUp size={12} />
                  </MoveButton>
                  <MoveButton
                    $disabled={index === orderedEpisodes.length - 1}
                    onClick={() => moveDown(index)}
                    aria-label="아래로 이동"
                  >
                    <ArrowDown size={12} />
                  </MoveButton>
                </MoveButtons>
              </Row>
              <InsertSlot onClick={() => onInsert(index + 2)}>
                <Plus size={12} /> 여기에 삽입
              </InsertSlot>
            </div>
          );
        })}
      </EpisodeList>
    </Wrapper>
  );
}
