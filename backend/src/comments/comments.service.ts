import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../common/schemas/comment.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';
import { Episode, EpisodeDocument } from '../common/schemas/episode.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Work.name)
    private readonly workModel: Model<WorkDocument>,
    @InjectModel(Episode.name)
    private readonly episodeModel: Model<EpisodeDocument>,
    private readonly logger: LoggerService,
  ) {}

  async listByEpisode(
    episodeId: string,
    userId?: string,
    page = 1,
    limit = 20,
    sort: 'latest' | 'best' = 'latest',
  ) {
    const filter = { episodeId, isDeleted: false, parentId: null };
    const sortOption =
      sort === 'best' ? { likeCount: -1 as const } : { createdAt: -1 as const };
    this.logger.debug(
      `comments.listByEpisode - find: ${JSON.stringify(filter)}, sort=${sort}, page=${page}, limit=${limit}`,
      'CommentsService',
    );

    try {
      const [items, total] = await Promise.all([
        this.commentModel
          .find(filter)
          .sort(sortOption)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'nickname profileImage')
          .lean(),
        this.commentModel.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;

      // Fetch replies for all top-level comments in a single query
      const parentIds = items.map((c) => c._id);
      this.logger.debug(
        `comments.listByEpisode - fetching replies for parentIds: [${parentIds.map((id) => id.toString()).join(', ')}]`,
        'CommentsService',
      );
      const replies = await this.commentModel
        .find({ parentId: { $in: parentIds }, isDeleted: false })
        .sort({ createdAt: 1 })
        .populate('userId', 'nickname profileImage')
        .lean();

      // Group replies by parentId
      const repliesByParentId = new Map<string, typeof replies>();
      for (const reply of replies) {
        const pid = reply.parentId.toString();
        if (!repliesByParentId.has(pid)) {
          repliesByParentId.set(pid, []);
        }
        repliesByParentId.get(pid).push(reply);
      }

      const mapComment = (comment: (typeof items)[0], replyList: typeof replies = []) => {
        const user = comment.userId as unknown as {
          _id: Types.ObjectId;
          nickname: string;
          profileImage?: string;
        };

        return {
          id: comment._id.toString(),
          episodeId: comment.episodeId.toString(),
          workId: comment.workId.toString(),
          userId: user._id.toString(),
          nickname: user.nickname,
          profileImage: user.profileImage,
          content: comment.content,
          likeCount: comment.likeCount ?? 0,
          dislikeCount: comment.dislikeCount ?? 0,
          isLiked: userId
            ? (comment.likedBy ?? []).some(
                (id) => id.toString() === userId,
              )
            : false,
          isDisliked: userId
            ? (comment.dislikedBy ?? []).some(
                (id) => id.toString() === userId,
              )
            : false,
          parentId: comment.parentId ? comment.parentId.toString() : null,
          replies: replyList.map((r) => mapComment(r)),
          createdAt: (comment as unknown as { createdAt: Date }).createdAt,
          updatedAt: (comment as unknown as { updatedAt: Date }).updatedAt,
        };
      };

      const mappedItems = items.map((comment) => {
        const commentReplies = repliesByParentId.get(comment._id.toString()) || [];
        return mapComment(comment, commentReplies);
      });

      this.logger.debug(
        `comments.listByEpisode - replies found: ${replies.length}, parentId values: [${replies.map((r) => r.parentId?.toString()).join(', ')}]`,
        'CommentsService',
      );
      this.logger.debug(
        `comments.listByEpisode - result: total=${total}, returned=${mappedItems.length}, repliesPerComment: ${mappedItems.map((c) => `${c.id}:${c.replies.length}`).join(', ')}`,
        'CommentsService',
      );

      return {
        items: mappedItems,
        total,
        page,
        limit,
        totalPages,
        hasNext,
      };
    } catch (error) {
      this.logger.error(
        `comments.listByEpisode - failed: ${error.message}`,
        error.stack,
        'CommentsService',
      );
      throw error;
    }
  }

  async create(
    workId: string,
    episodeId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    this.logger.log(
      `comments.create - workId: ${workId}, episodeId: ${episodeId}, userId: ${userId}, parentId: ${parentId || 'null'}`,
      'CommentsService',
    );

    // Verify episode exists and belongs to workId
    this.logger.debug(
      `comments.create - episodeModel.findOne: { _id: ${episodeId}, workId: ${workId} }`,
      'CommentsService',
    );
    const episode = await this.episodeModel.findOne({
      _id: episodeId,
      workId,
    });
    if (!episode) {
      this.logger.error(
        `comments.create - episode not found: episodeId=${episodeId}, workId=${workId}`,
        undefined,
        'CommentsService',
      );
      throw new NotFoundException('Episode not found');
    }

    // Validate parentId if provided (reply)
    if (parentId) {
      this.logger.debug(
        `comments.create - validating parentId: ${parentId}`,
        'CommentsService',
      );
      const parentComment = await this.commentModel.findById(parentId);
      if (!parentComment || parentComment.isDeleted) {
        this.logger.error(
          `comments.create - parent comment not found: ${parentId}`,
          undefined,
          'CommentsService',
        );
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.episodeId.toString() !== episodeId) {
        this.logger.error(
          `comments.create - parent comment belongs to different episode: parentEpisodeId=${parentComment.episodeId}, episodeId=${episodeId}`,
          undefined,
          'CommentsService',
        );
        throw new BadRequestException('Parent comment belongs to a different episode');
      }
      if (parentComment.parentId != null) {
        this.logger.error(
          `comments.create - nested reply not allowed: parentId=${parentId} already has parentId=${parentComment.parentId}`,
          undefined,
          'CommentsService',
        );
        throw new BadRequestException('Nested replies are not allowed');
      }
    }

    try {
      this.logger.debug(
        `comments.create - commentModel.create: { workId: ${workId}, episodeId: ${episodeId}, userId: ${userId}, parentId: ${parentId || 'null'}, contentLength: ${content.length} }`,
        'CommentsService',
      );
      const comment = await this.commentModel.create({
        workId,
        episodeId,
        userId,
        content,
        parentId: parentId ? new Types.ObjectId(parentId) : null,
      });

      // Increment Work.stats.commentCount
      this.logger.debug(
        `comments.create - workModel.findByIdAndUpdate: ${workId}, $inc stats.commentCount`,
        'CommentsService',
      );
      await this.workModel.findByIdAndUpdate(workId, {
        $inc: { 'stats.commentCount': 1 },
      });

      // Populate user info for the response
      const populated = await this.commentModel
        .findById(comment._id)
        .populate('userId', 'nickname profileImage')
        .lean();

      const user = populated.userId as unknown as {
        _id: Types.ObjectId;
        nickname: string;
        profileImage?: string;
      };

      this.logger.log(
        `comments.create - success: _id=${comment._id}`,
        'CommentsService',
      );

      return {
        id: populated._id.toString(),
        episodeId: populated.episodeId.toString(),
        workId: populated.workId.toString(),
        userId: user._id.toString(),
        nickname: user.nickname,
        profileImage: user.profileImage,
        content: populated.content,
        likeCount: populated.likeCount,
        dislikeCount: populated.dislikeCount,
        isLiked: false,
        isDisliked: false,
        parentId: populated.parentId ? populated.parentId.toString() : null,
        replies: [],
        createdAt: (populated as unknown as { createdAt: Date }).createdAt,
        updatedAt: (populated as unknown as { updatedAt: Date }).updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `comments.create - failed: ${error.message}`,
        error.stack,
        'CommentsService',
      );
      throw error;
    }
  }

  async toggleLike(commentId: string, userId: string) {
    this.logger.log(
      `comments.toggleLike - commentId: ${commentId}, userId: ${userId}`,
      'CommentsService',
    );

    this.logger.debug(
      `comments.toggleLike - commentModel.findById: ${commentId}`,
      'CommentsService',
    );
    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      this.logger.error(
        `comments.toggleLike - comment not found: ${commentId}`,
        undefined,
        'CommentsService',
      );
      throw new NotFoundException('Comment not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const alreadyLiked = comment.likedBy.some(
      (id) => id.toString() === userId,
    );

    try {
      let updated: CommentDocument;
      if (alreadyLiked) {
        this.logger.debug(
          `comments.toggleLike - removing like: commentId=${commentId}, userId=${userId}`,
          'CommentsService',
        );
        updated = await this.commentModel.findByIdAndUpdate(
          commentId,
          {
            $pull: { likedBy: userObjectId },
            $inc: { likeCount: -1 },
          },
          { new: true },
        );
      } else {
        this.logger.debug(
          `comments.toggleLike - adding like: commentId=${commentId}, userId=${userId}`,
          'CommentsService',
        );
        updated = await this.commentModel.findByIdAndUpdate(
          commentId,
          {
            $addToSet: { likedBy: userObjectId },
            $inc: { likeCount: 1 },
          },
          { new: true },
        );
      }

      this.logger.log(
        `comments.toggleLike - success: commentId=${commentId}, liked=${!alreadyLiked}, likeCount=${updated.likeCount}`,
        'CommentsService',
      );

      return {
        id: updated._id.toString(),
        likeCount: updated.likeCount,
        isLiked: !alreadyLiked,
      };
    } catch (error) {
      this.logger.error(
        `comments.toggleLike - failed: ${error.message}`,
        error.stack,
        'CommentsService',
      );
      throw error;
    }
  }

  async toggleDislike(commentId: string, userId: string) {
    this.logger.log(
      `comments.toggleDislike - commentId: ${commentId}, userId: ${userId}`,
      'CommentsService',
    );

    this.logger.debug(
      `comments.toggleDislike - commentModel.findById: ${commentId}`,
      'CommentsService',
    );
    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      this.logger.error(
        `comments.toggleDislike - comment not found: ${commentId}`,
        undefined,
        'CommentsService',
      );
      throw new NotFoundException('Comment not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const alreadyDisliked = comment.dislikedBy.some(
      (id) => id.toString() === userId,
    );
    const alreadyLiked = comment.likedBy.some(
      (id) => id.toString() === userId,
    );

    try {
      let updated: CommentDocument;
      if (alreadyDisliked) {
        // Remove dislike
        this.logger.debug(
          `comments.toggleDislike - removing dislike: commentId=${commentId}, userId=${userId}`,
          'CommentsService',
        );
        updated = await this.commentModel.findByIdAndUpdate(
          commentId,
          {
            $pull: { dislikedBy: userObjectId },
            $inc: { dislikeCount: -1 },
          },
          { new: true },
        );
      } else {
        // Add dislike, and remove like if exists
        this.logger.debug(
          `comments.toggleDislike - adding dislike: commentId=${commentId}, userId=${userId}, removingLike=${alreadyLiked}`,
          'CommentsService',
        );

        if (alreadyLiked) {
          // MongoDB $addToSet and $pull cannot coexist at top level,
          // so we use two separate operations: first remove like, then add dislike.
          this.logger.debug(
            `comments.toggleDislike - removing existing like before adding dislike: commentId=${commentId}, userId=${userId}`,
            'CommentsService',
          );
          await this.commentModel.findByIdAndUpdate(commentId, {
            $pull: { likedBy: userObjectId },
            $inc: { likeCount: -1 },
          });
          updated = await this.commentModel.findByIdAndUpdate(
            commentId,
            {
              $addToSet: { dislikedBy: userObjectId },
              $inc: { dislikeCount: 1 },
            },
            { new: true },
          );
        } else {
          updated = await this.commentModel.findByIdAndUpdate(
            commentId,
            {
              $addToSet: { dislikedBy: userObjectId },
              $inc: { dislikeCount: 1 },
            },
            { new: true },
          );
        }
      }

      this.logger.log(
        `comments.toggleDislike - success: commentId=${commentId}, disliked=${!alreadyDisliked}, dislikeCount=${updated.dislikeCount}`,
        'CommentsService',
      );

      return {
        id: updated._id.toString(),
        dislikeCount: updated.dislikeCount,
        isDisliked: !alreadyDisliked,
        likeCount: updated.likeCount,
        isLiked: alreadyLiked ? false : comment.likedBy.some((id) => id.toString() === userId),
      };
    } catch (error) {
      this.logger.error(
        `comments.toggleDislike - failed: ${error.message}`,
        error.stack,
        'CommentsService',
      );
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string) {
    this.logger.log(
      `comments.deleteComment - commentId: ${commentId}, userId: ${userId}`,
      'CommentsService',
    );

    this.logger.debug(
      `comments.deleteComment - commentModel.findById: ${commentId}`,
      'CommentsService',
    );
    const comment = await this.commentModel.findById(commentId);
    if (!comment || comment.isDeleted) {
      this.logger.error(
        `comments.deleteComment - comment not found: ${commentId}`,
        undefined,
        'CommentsService',
      );
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      this.logger.error(
        `comments.deleteComment - forbidden: userId=${userId}, comment.userId=${comment.userId}`,
        undefined,
        'CommentsService',
      );
      throw new ForbiddenException('Not the author of this comment');
    }

    try {
      // Soft delete
      this.logger.debug(
        `comments.deleteComment - commentModel.findByIdAndUpdate: ${commentId}, set isDeleted=true`,
        'CommentsService',
      );
      await this.commentModel.findByIdAndUpdate(commentId, {
        isDeleted: true,
      });

      // Decrement Work.stats.commentCount
      this.logger.debug(
        `comments.deleteComment - workModel.findByIdAndUpdate: ${comment.workId}, $inc stats.commentCount -1`,
        'CommentsService',
      );
      await this.workModel.findByIdAndUpdate(comment.workId, {
        $inc: { 'stats.commentCount': -1 },
      });

      this.logger.log(
        `comments.deleteComment - success: commentId=${commentId}`,
        'CommentsService',
      );

      return { deleted: true };
    } catch (error) {
      this.logger.error(
        `comments.deleteComment - failed: ${error.message}`,
        error.stack,
        'CommentsService',
      );
      throw error;
    }
  }
}
