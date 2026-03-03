export interface Comment {
  id: string;
  episodeId: string;
  workId: string;
  userId: string;
  nickname: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
  dislikeCount: number;
  isDisliked: boolean;
  parentId: string | null;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  content: string;
  parentId?: string;
}

export interface CommentListResponse {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}
