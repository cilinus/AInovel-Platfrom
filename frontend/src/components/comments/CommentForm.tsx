'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAuthStore } from '@/src/stores/authStore';
import { useCreateComment } from '@/src/hooks/useComments';
import Button from '@/src/components/common/Button';

interface CommentFormProps {
  workId: string;
  episodeId: string;
  onCommentCreated: (comment: any) => void;
  parentId?: string;
  onCancel?: () => void;
}

const FormWrapper = styled.div`
  margin-top: 1rem;
`;

const TextareaStyled = styled.textarea<{ $compact?: boolean }>`
  width: 100%;
  min-height: ${({ $compact }) => ($compact ? '3rem' : '5rem')};
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedForeground};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CharCount = styled.span<{ $over?: boolean }>`
  font-size: 0.75rem;
  color: ${({ $over, theme }) => $over ? theme.colors.destructive : theme.colors.mutedForeground};
`;

const LoginHint = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 1rem;
  margin: 1rem 0 0;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const MAX_LENGTH = 500;

export default function CommentForm({
  workId,
  episodeId,
  onCommentCreated,
  parentId,
  onCancel,
}: CommentFormProps) {
  const { isAuthenticated } = useAuthStore();
  const { createComment, loading } = useCreateComment();
  const [content, setContent] = useState('');

  const isReply = !!parentId;

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;
    try {
      const comment = await createComment(workId, episodeId, trimmed, parentId);
      onCommentCreated(comment);
      setContent('');
    } catch {
      // error is handled by the hook
    }
  }, [content, workId, episodeId, createComment, onCommentCreated, parentId]);

  if (!isAuthenticated) {
    return <LoginHint>로그인 후 댓글을 작성할 수 있습니다.</LoginHint>;
  }

  return (
    <FormWrapper>
      <TextareaStyled
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isReply ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
        maxLength={MAX_LENGTH}
        disabled={loading}
        $compact={isReply}
      />
      <BottomRow>
        <CharCount $over={content.length > MAX_LENGTH}>
          {content.length}/{MAX_LENGTH}
        </CharCount>
        <ButtonGroup>
          {isReply && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              취소
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !content.trim() || content.length > MAX_LENGTH}
          >
            {loading ? '등록 중...' : isReply ? '답글 등록' : '댓글 등록'}
          </Button>
        </ButtonGroup>
      </BottomRow>
    </FormWrapper>
  );
}