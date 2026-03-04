'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';
import type { PlotOutlineItem } from '@/src/types/novel';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const OutlineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const OutlineCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.card};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ChapterLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const GenerateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChapterInput = styled.input`
  width: 80px;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 1.5rem;
  margin: 0;
`;

const StatusText = styled.p<{ $error?: boolean }>`
  font-size: 0.8125rem;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.destructive : theme.colors.secondary};
  margin: 0;
`;

interface PlotOutlineEditorProps {
  projectId: string;
}

export default function PlotOutlineEditor({ projectId }: PlotOutlineEditorProps) {
  const { fetchOutline, updateOutline, generateOutline, loading, error } = useNovelProjects();
  const [items, setItems] = useState<PlotOutlineItem[]>([]);
  const [totalChapters, setTotalChapters] = useState(10);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadOutline = async () => {
      const data = await fetchOutline(projectId);
      if (data.length > 0) {
        setItems(data);
      }
    };
    loadOutline();
  }, [projectId, fetchOutline]);

  const updateItem = useCallback((index: number, field: keyof PlotOutlineItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }, []);

  const addItem = useCallback(() => {
    const nextNumber = items.length > 0
      ? Math.max(...items.map((i) => i.chapterNumber)) + 1
      : 1;
    setItems((prev) => [
      ...prev,
      { chapterNumber: nextNumber, goal: '', keyEvents: '' },
    ]);
  }, [items]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatusMsg(null);
    await updateOutline(projectId, items);
    setSaving(false);
    setStatusMsg('저장되었습니다.');
  }, [projectId, items, updateOutline]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setStatusMsg(null);
    const data = await generateOutline(projectId, totalChapters);
    if (data.length > 0) {
      setItems(data);
      setStatusMsg('AI 아웃라인이 생성되었습니다.');
    }
    setGenerating(false);
  }, [projectId, totalChapters, generateOutline]);

  return (
    <Wrapper>
      <HeaderRow>
        <SectionTitle>플롯 아웃라인</SectionTitle>
        <ButtonGroup>
          <Button variant="outline" size="sm" onClick={addItem}>
            항목 추가
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || items.length === 0}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </ButtonGroup>
      </HeaderRow>

      <GenerateRow>
        <span style={{ fontSize: '0.8125rem' }}>총</span>
        <ChapterInput
          type="number"
          min={1}
          max={100}
          value={totalChapters}
          onChange={(e) => setTotalChapters(Number(e.target.value))}
        />
        <span style={{ fontSize: '0.8125rem' }}>화</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? '생성 중...' : 'AI 아웃라인 생성'}
        </Button>
      </GenerateRow>

      {items.length === 0 ? (
        <EmptyText>아웃라인이 없습니다. 항목을 추가하거나 AI로 생성하세요.</EmptyText>
      ) : (
        <OutlineList>
          {items.map((item, idx) => (
            <OutlineCard key={idx}>
              <CardHeader>
                <ChapterLabel>{item.chapterNumber}화</ChapterLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(idx)}
                >
                  삭제
                </Button>
              </CardHeader>
              <FieldGroup>
                <FieldLabel>목표</FieldLabel>
                <FieldTextarea
                  value={item.goal}
                  onChange={(e) => updateItem(idx, 'goal', e.target.value)}
                  placeholder="이 챕터의 목표"
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>핵심 사건</FieldLabel>
                <FieldTextarea
                  value={item.keyEvents}
                  onChange={(e) => updateItem(idx, 'keyEvents', e.target.value)}
                  placeholder="주요 이벤트"
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>메모</FieldLabel>
                <FieldInput
                  value={item.notes ?? ''}
                  onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                  placeholder="기타 메모 (선택사항)"
                />
              </FieldGroup>
            </OutlineCard>
          ))}
        </OutlineList>
      )}

      {(error || statusMsg) && (
        <StatusText $error={!!error}>
          {error || statusMsg}
        </StatusText>
      )}
    </Wrapper>
  );
}