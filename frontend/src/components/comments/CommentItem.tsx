'use client';

import styled from 'styled-components';
import { User, ThumbsUp, ThumbsDown, MessageCircle, CornerDownRight } from 'lucide-react';
import type { Comment } from '@/src/types/comment';

interface CommentItemProps {
  comment: Comment;
  onToggleLike: (commentId: string) => void;
  onToggleDislike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  depth?: number;
}

const ItemWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.muted};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const Nickname = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const DateText = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const CommentText = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  word-break: keep-all;
  white-space: pre-wrap;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LikeButton = styled.button<{ $liked?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
  padding: 0.125rem 0.375rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${({ $liked, theme }) =>
    $liked ? theme.colors.primary : theme.colors.mutedForeground};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DislikeButton = styled.button<{ $disliked?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
  padding: 0.125rem 0.375rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${({ $disliked, theme }) =>
    $disliked ? theme.colors.destructive : theme.colors.mutedForeground};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.destructive};
  }
`;

const ReplyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.375rem;
  padding: 0.125rem 0.375rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const RepliesWrapper = styled.div`
  margin-left: 2.5rem;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  padding-left: 0.75rem;
`;

const ReplyIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.25rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

export default function CommentItem({
  comment,
  onToggleLike,
  onToggleDislike,
  onReply,
  depth = 0,
}: CommentItemProps) {
  return (
    <>
      <ItemWrapper>
        <Avatar>
          {depth > 0 ? (
            <ReplyIndicator>
              <CornerDownRight size={14} />
            </ReplyIndicator>
          ) : (
            <User size={14} />
          )}
        </Avatar>
        <ContentWrapper>
          <TopRow>
            <Nickname>{comment.nickname}</Nickname>
            <DateText>{formatRelativeDate(comment.createdAt)}</DateText>
          </TopRow>
          <CommentText>{comment.content}</CommentText>
          <ActionRow>
            <LikeButton
              type="button"
              $liked={comment.isLiked}
              onClick={() => onToggleLike(comment.id)}
            >
              <ThumbsUp size={12} />
              {comment.likeCount > 0 && comment.likeCount}
            </LikeButton>
            <DislikeButton
              type="button"
              $disliked={comment.isDisliked}
              onClick={() => onToggleDislike(comment.id)}
            >
              <ThumbsDown size={12} />
              {comment.dislikeCount > 0 && comment.dislikeCount}
            </DislikeButton>
            {depth === 0 && (
              <ReplyButton type="button" onClick={() => onReply(comment.id)}>
                <MessageCircle size={12} />
                답글
              </ReplyButton>
            )}
          </ActionRow>
        </ContentWrapper>
      </ItemWrapper>
      {comment.replies && comment.replies.length > 0 && (
        <RepliesWrapper>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onToggleLike={onToggleLike}
              onToggleDislike={onToggleDislike}
              onReply={onReply}
              depth={1}
            />
          ))}
        </RepliesWrapper>
      )}
    </>
  );
}