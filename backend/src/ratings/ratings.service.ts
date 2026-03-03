import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating, RatingDocument } from '../common/schemas/rating.schema';
import { EpisodeRating, EpisodeRatingDocument } from '../common/schemas/episode-rating.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';
import { Episode, EpisodeDocument } from '../common/schemas/episode.schema';
import { LoggerService } from '../logger/logger.service';

export interface RatingStats {
  workId: string;
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
  userRating: number | null;
}

export interface EpisodeRatingStats {
  episodeId: string;
  workId: string;
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
  userRating: number | null;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
    @InjectModel(EpisodeRating.name) private episodeRatingModel: Model<EpisodeRatingDocument>,
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    private readonly logger: LoggerService,
  ) {}

  async getRatingStats(workId: string, userId?: string): Promise<RatingStats> {
    this.logger.debug(
      `ratings.getRatingStats - workId: ${workId}, userId: ${userId ?? 'anonymous'}`,
      'RatingsService',
    );

    try {
      const workObjectId = new Types.ObjectId(workId);

      // Get all ratings for the work using aggregation
      const aggregationResult = await this.ratingModel.aggregate([
        { $match: { workId: workObjectId } },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalSum: { $sum: '$score' },
            scores: { $push: '$score' },
          },
        },
      ]);

      this.logger.debug(
        `ratings.getRatingStats aggregation result: ${JSON.stringify(aggregationResult)}`,
        'RatingsService',
      );

      // Build distribution (1-5)
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let averageRating = 0;
      let ratingCount = 0;

      if (aggregationResult.length > 0) {
        const { totalCount, totalSum, scores } = aggregationResult[0];
        ratingCount = totalCount;
        averageRating = ratingCount > 0 ? Math.round((totalSum / ratingCount) * 10) / 10 : 0;

        for (const score of scores) {
          distribution[score] = (distribution[score] || 0) + 1;
        }
      }

      // Get user's own rating if userId provided
      let userRating: number | null = null;
      if (userId) {
        const userRatingDoc = await this.ratingModel
          .findOne({ workId: workObjectId, userId: new Types.ObjectId(userId) })
          .lean();

        this.logger.debug(
          `ratings.getRatingStats userRating query: workId=${workId}, userId=${userId}, found=${!!userRatingDoc}`,
          'RatingsService',
        );

        if (userRatingDoc) {
          userRating = userRatingDoc.score;
        }
      }

      const stats: RatingStats = {
        workId,
        averageRating,
        ratingCount,
        distribution,
        userRating,
      };

      this.logger.log(
        `ratings.getRatingStats 성공 - workId: ${workId}, avg: ${averageRating}, count: ${ratingCount}`,
        'RatingsService',
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `ratings.getRatingStats 실패 - workId: ${workId}: ${error.message}`,
        error.stack,
        'RatingsService',
      );
      throw error;
    }
  }

  async submitRating(
    workId: string,
    userId: string,
    score: number,
  ): Promise<RatingStats> {
    this.logger.log(
      `ratings.submitRating - workId: ${workId}, userId: ${userId}, score: ${score}`,
      'RatingsService',
    );

    try {
      const workObjectId = new Types.ObjectId(workId);
      const userObjectId = new Types.ObjectId(userId);

      // Verify work exists
      const work = await this.workModel.findById(workObjectId);
      if (!work) {
        throw new NotFoundException('Work not found');
      }

      // Upsert: one rating per user per work
      await this.ratingModel.findOneAndUpdate(
        { workId: workObjectId, userId: userObjectId },
        { score },
        { upsert: true, new: true },
      );

      this.logger.debug(
        `ratings.submitRating upsert 완료 - workId: ${workId}, userId: ${userId}, score: ${score}`,
        'RatingsService',
      );

      // Recalculate work stats using aggregation
      const statsResult = await this.ratingModel.aggregate([
        { $match: { workId: workObjectId } },
        {
          $group: {
            _id: null,
            ratingSum: { $sum: '$score' },
            ratingCount: { $sum: 1 },
          },
        },
      ]);

      const ratingSum = statsResult.length > 0 ? statsResult[0].ratingSum : 0;
      const ratingCount = statsResult.length > 0 ? statsResult[0].ratingCount : 0;

      this.logger.debug(
        `ratings.submitRating stats recalc - ratingSum: ${ratingSum}, ratingCount: ${ratingCount}`,
        'RatingsService',
      );

      // Update Work stats
      await this.workModel.findByIdAndUpdate(workObjectId, {
        'stats.ratingSum': ratingSum,
        'stats.ratingCount': ratingCount,
      });

      this.logger.log(
        `ratings.submitRating 성공 - workId: ${workId}, newSum: ${ratingSum}, newCount: ${ratingCount}`,
        'RatingsService',
      );

      // Return updated stats
      return this.getRatingStats(workId, userId);
    } catch (error) {
      this.logger.error(
        `ratings.submitRating 실패 - workId: ${workId}, userId: ${userId}: ${error.message}`,
        error.stack,
        'RatingsService',
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Episode Ratings
  // ---------------------------------------------------------------------------

  async getEpisodeRatingStats(
    workId: string,
    episodeId: string,
    userId?: string,
  ): Promise<EpisodeRatingStats> {
    this.logger.debug(
      `ratings.getEpisodeRatingStats - workId: ${workId}, episodeId: ${episodeId}, userId: ${userId ?? 'anonymous'}`,
      'RatingsService',
    );

    try {
      const episodeObjectId = new Types.ObjectId(episodeId);

      const aggregationResult = await this.episodeRatingModel.aggregate([
        { $match: { episodeId: episodeObjectId } },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalSum: { $sum: '$score' },
            scores: { $push: '$score' },
          },
        },
      ]);

      this.logger.debug(
        `ratings.getEpisodeRatingStats aggregation result: ${JSON.stringify(aggregationResult)}`,
        'RatingsService',
      );

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let averageRating = 0;
      let ratingCount = 0;

      if (aggregationResult.length > 0) {
        const { totalCount, totalSum, scores } = aggregationResult[0];
        ratingCount = totalCount;
        averageRating = ratingCount > 0 ? Math.round((totalSum / ratingCount) * 10) / 10 : 0;

        for (const score of scores) {
          distribution[score] = (distribution[score] || 0) + 1;
        }
      }

      let userRating: number | null = null;
      if (userId) {
        const userRatingDoc = await this.episodeRatingModel
          .findOne({ episodeId: episodeObjectId, userId: new Types.ObjectId(userId) })
          .lean();

        this.logger.debug(
          `ratings.getEpisodeRatingStats userRating query: episodeId=${episodeId}, userId=${userId}, found=${!!userRatingDoc}`,
          'RatingsService',
        );

        if (userRatingDoc) {
          userRating = userRatingDoc.score;
        }
      }

      const stats: EpisodeRatingStats = {
        episodeId,
        workId,
        averageRating,
        ratingCount,
        distribution,
        userRating,
      };

      this.logger.log(
        `ratings.getEpisodeRatingStats 성공 - episodeId: ${episodeId}, avg: ${averageRating}, count: ${ratingCount}`,
        'RatingsService',
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `ratings.getEpisodeRatingStats 실패 - episodeId: ${episodeId}: ${error.message}`,
        error.stack,
        'RatingsService',
      );
      throw error;
    }
  }

  async submitEpisodeRating(
    workId: string,
    episodeId: string,
    userId: string,
    score: number,
  ): Promise<EpisodeRatingStats> {
    this.logger.log(
      `ratings.submitEpisodeRating - workId: ${workId}, episodeId: ${episodeId}, userId: ${userId}, score: ${score}`,
      'RatingsService',
    );

    try {
      const episodeObjectId = new Types.ObjectId(episodeId);
      const workObjectId = new Types.ObjectId(workId);
      const userObjectId = new Types.ObjectId(userId);

      const episode = await this.episodeModel.findById(episodeObjectId);
      if (!episode) {
        throw new NotFoundException('Episode not found');
      }

      await this.episodeRatingModel.findOneAndUpdate(
        { episodeId: episodeObjectId, userId: userObjectId },
        { score, workId: workObjectId },
        { upsert: true, new: true },
      );

      this.logger.debug(
        `ratings.submitEpisodeRating upsert 완료 - episodeId: ${episodeId}, userId: ${userId}, score: ${score}`,
        'RatingsService',
      );

      this.logger.log(
        `ratings.submitEpisodeRating 성공 - episodeId: ${episodeId}`,
        'RatingsService',
      );

      return this.getEpisodeRatingStats(workId, episodeId, userId);
    } catch (error) {
      this.logger.error(
        `ratings.submitEpisodeRating 실패 - episodeId: ${episodeId}, userId: ${userId}: ${error.message}`,
        error.stack,
        'RatingsService',
      );
      throw error;
    }
  }
}
