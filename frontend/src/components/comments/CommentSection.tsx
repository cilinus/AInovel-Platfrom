'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { MessageSquare } from 'lucide-react';
import { useComments } from '@/src/hooks/useComments';
import type { Comment } from '@/src/types/comment';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import Button from '@/src/components/common/Button';
import Loading from '@/src/components/common/Loading';

interface CommentSectionProps {
  workId: string;
  episodeId: string;
}

const SectionWrapper = styled.section`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const CountBadge = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const TabRow = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.mutedForeground};
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const CommentList = styled.div`
  margin-top: 1rem;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 2rem 0;
`;

const LoadMoreWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem 0;
`;

const ReplyFormWrapper = styled.div`
  margin-left: 2.5rem;
  padding-left: 0.75rem;
`;

export default function CommentSection({ workId, episodeId }: CommentSectionProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'best'>('latest');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);

  const {
    comments,
    total,
    hasNext,
    loading,
    loadMore,
    addComment,
    toggleLike,
    toggleDislike,
  } = useComments(workId, episodeId, activeTab);

  const handleCommentCreated = (comment: Comment) => {
    addComment(comment);
    if (comment.parentId) {
      setReplyTargetId(null);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyTargetId((prev) => (prev === commentId ? null : commentId));
  };

  return (
    <SectionWrapper>
      <SectionHeader>
        <MessageSquare size={18} />
        <SectionTitle>댓글</SectionTitle>
        <CountBadge>({total}개)</CountBadge>
      </SectionHeader>

      <CommentForm
        workId={workId}
        episodeId={episodeId}
        onCommentCreated={handleCommentCreated}
      />

      <TabRow>
        <Tab
          type="button"
          $active={activeTab === 'latest'}
          onClick={() => setActiveTab('latest')}
        >
          최신순
        </Tab>
        <Tab
          type="button"
          $active={activeTab === 'best'}
          onClick={() => setActiveTab('best')}
        >
          베스트
        </Tab>
      </TabRow>

      <CommentList>
        {loading && comments.length === 0 && <Loading />}
        {!loading && comments.length === 0 && (
          <EmptyText>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</EmptyText>
        )}
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              onToggleLike={toggleLike}
              onToggleDislike={toggleDislike}
              onReply={handleReply}
            />
            {replyTargetId === comment.id && (
              <ReplyFormWrapper>
                <CommentForm
                  workId={workId}
                  episodeId={episodeId}
                  parentId={replyTargetId}
                  onCommentCreated={handleCommentCreated}
                  onCancel={() => setReplyTargetId(null)}
                />
              </ReplyFormWrapper>
            )}
          </div>
        ))}
      </CommentList>

      {hasNext && (
        <LoadMoreWrapper>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? '불러오는 중...' : '더보기'}
          </Button>
        </LoadMoreWrapper>
      )}
    </SectionWrapper>
  );
}