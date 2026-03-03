import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bookmark, BookmarkDocument } from '../common/schemas/bookmark.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
    private readonly logger: LoggerService,
  ) {}

  async toggle(userId: string, workId: string): Promise<{ bookmarked: boolean }> {
    this.logger.debug(
      `bookmarks.toggle - userId: ${userId}, workId: ${workId}`,
      'BookmarksService',
    );

    const existing = await this.bookmarkModel.findOneAndDelete({
      userId,
      workId,
    });

    if (existing) {
      this.logger.debug(
        `bookmarks.toggle - removed bookmark: userId=${userId}, workId=${workId}`,
        'BookmarksService',
      );
      await this.workModel.findByIdAndUpdate(workId, {
        $inc: { 'stats.bookmarkCount': -1 },
      });
      return { bookmarked: false };
    }

    await this.bookmarkModel.create({ userId, workId });
    this.logger.debug(
      `bookmarks.toggle - created bookmark: userId=${userId}, workId=${workId}`,
      'BookmarksService',
    );
    await this.workModel.findByIdAndUpdate(workId, {
      $inc: { 'stats.bookmarkCount': 1 },
    });
    return { bookmarked: true };
  }

  async list(userId: string, page = 1, limit = 20) {
    const filter = { userId };
    this.logger.debug(
      `bookmarks.list - find: ${JSON.stringify(filter)}, page=${page}, limit=${limit}`,
      'BookmarksService',
    );

    const [bookmarks, total] = await Promise.all([
      this.bookmarkModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'workId',
          populate: { path: 'authorId', select: 'nickname profileImage' },
        })
        .lean(),
      this.bookmarkModel.countDocuments(filter),
    ]);

    // 프론트엔드가 ApiWork[] 형태를 기대하므로 work 객체를 직접 반환
    const items = bookmarks
      .map((b: any) => b.workId)
      .filter(Boolean);

    this.logger.debug(
      `bookmarks.list - result: total=${total}, returned=${items.length}`,
      'BookmarksService',
    );

    return { items, total, page, limit };
  }

  async isBookmarked(userId: string, workId: string): Promise<{ bookmarked: boolean }> {
    this.logger.debug(
      `bookmarks.isBookmarked - userId: ${userId}, workId: ${workId}`,
      'BookmarksService',
    );

    const exists = await this.bookmarkModel.exists({ userId, workId });
    return { bookmarked: !!exists };
  }
}
