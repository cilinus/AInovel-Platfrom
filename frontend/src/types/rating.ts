export interface Rating {
  id: string;
  workId: string;
  userId: string;
  score: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  workId: string;
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>; // { 1: count, 2: count, ... 5: count }
  userRating: number | null; // current user's rating, null if not rated
}

export interface RatingSubmitRequest {
  score: number; // 1-5
}

export interface EpisodeRatingStats {
  episodeId: string;
  workId: string;
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
  userRating: number | null;
}
