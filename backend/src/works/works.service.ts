import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, SortOrder, Types } from 'mongoose';
import { Work, WorkDocument, WorkStatus } from '../common/schemas/work.schema';
import { WorkLike, WorkLikeDocument } from '../common/schemas/work-like.schema';
import { LoggerService } from '../logger/logger.service';
import { UpdateWorkDto } from './dto/update-work.dto';
import * as fs from 'fs';
import * as path from 'path';

interface ListOptions {
  genre?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
    @InjectModel(WorkLike.name) private workLikeModel: Model<WorkLikeDocument>,
    private readonly logger: LoggerService,
  ) {}

  async create(authorId: string, data: Record<string, any>): Promise<WorkDocument> {
    this.logger.log(
      `works.create 시작 - authorId: ${authorId}, data keys: ${Object.keys(data).join(', ')}`,
      'WorksService',
    );
    const doc: Partial<Work> & { authorId: string } = {
      authorId,
      title: data.title,
      description: data.synopsis ?? data.description,
      genre: data.genre,
      tags: data.tags ?? [],
      subGenres: data.subGenres ?? [],
      status: WorkStatus.ONGOING,
      tokenPrice: data.pricePerEpisode ?? data.tokenPrice ?? 2,
      freeEpisodeCount: data.freeEpisodeCount ?? 3,
    };
    if (data.coverImageUrl || data.coverImage) {
      doc.coverImage = data.coverImageUrl ?? data.coverImage;
    }
    if (data.backgroundImageUrl || data.backgroundImage) {
      (doc as any).backgroundImage = data.backgroundImageUrl ?? data.backgroundImage;
    }
    if (data.isAIGenerated !== undefined) {
      doc.isAIGenerated = data.isAIGenerated;
    }
    this.logger.log(`works.create doc: ${JSON.stringify(doc)}`, 'WorksService');
    try {
      const result = await this.workModel.create(doc);
      this.logger.log(`works.create 성공 - _id: ${result._id}`, 'WorksService');
      return result;
    } catch (error) {
      this.logger.error(
        `works.create 실패: ${error.message}`,
        error.stack,
        'WorksService',
      );
      throw error;
    }
  }

  async findById(id: string): Promise<WorkDocument> {
    this.logger.debug(`works.findById: ${id}`, 'WorksService');
    const work = await this.workModel.findById(id).populate('authorId', 'nickname profileImage');
    if (!work) throw new NotFoundException('Work not found');
    return work;
  }

  async findByAuthor(authorId: string, page = 1, limit = 20) {
    const filter: FilterQuery<Work> = { authorId };
    this.logger.debug(`works.findByAuthor: ${JSON.stringify(filter)}`, 'WorksService');

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.workModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async list(options: ListOptions) {
    const { genre, status, sort = 'latest', page = 1, limit = 20 } = options;
    const filter: FilterQuery<Work> = {};
    if (genre) filter.genre = genre;
    if (status) filter.status = status;
    else filter.status = { $in: [WorkStatus.ONGOING, WorkStatus.COMPLETED] };

    this.logger.debug(`works.list: filter=${JSON.stringify(filter)}, sort=${sort}`, 'WorksService');

    const total = await this.workModel.countDocuments(filter);

    // 인기 랭킹: viewCount + likeCount 합산 점수로 정렬 (aggregation)
    if (sort === 'popular') {
      const items = await this.workModel.aggregate([
        { $match: filter },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $ifNull: ['$stats.viewCount', 0] },
                { $ifNull: ['$stats.likeCount', 0] },
              ],
            },
          },
        },
        { $sort: { popularityScore: -1 as const } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: '_author',
            pipeline: [{ $project: { nickname: 1, profileImage: 1 } }],
          },
        },
        {
          $addFields: {
            authorId: { $arrayElemAt: ['$_author', 0] },
          },
        },
        { $project: { _author: 0, popularityScore: 0 } },
      ]);

      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const sortMap: Record<string, Record<string, SortOrder>> = {
      latest: { createdAt: -1 },
      rating: { 'stats.ratingCount': -1 },
      '-createdAt': { createdAt: -1 },
      '-viewCount': { 'stats.viewCount': -1 },
      '-likeCount': { 'stats.likeCount': -1 },
    };

    const items = await this.workModel
      .find(filter)
      .sort(sortMap[sort] ?? { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('authorId', 'nickname');

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async search(query: string, page = 1, limit = 20) {
    const filter = { $text: { $search: query } };
    const [items, total] = await Promise.all([
      this.workModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(limit),
      this.workModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async incrementView(id: string): Promise<void> {
    await this.workModel.findByIdAndUpdate(id, {
      $inc: { 'stats.viewCount': 1 },
    });
  }

  async update(
    workId: string,
    authorId: string,
    data: UpdateWorkDto,
  ): Promise<WorkDocument> {
    this.logger.log(
      `works.update - workId: ${workId}, authorId: ${authorId}, data: ${JSON.stringify(data)}`,
      'WorksService',
    );

    const work = await this.workModel.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('You are not the author of this work');
    }

    const updated = await this.workModel.findByIdAndUpdate(workId, data, {
      new: true,
    });
    this.logger.log(`works.update 성공 - workId: ${workId}`, 'WorksService');
    return updated;
  }

  async updateCoverImage(
    workId: string,
    authorId: string,
    imagePath: string,
  ): Promise<WorkDocument> {
    this.logger.log(
      `works.updateCoverImage - workId: ${workId}, authorId: ${authorId}, imagePath: ${imagePath}`,
      'WorksService',
    );

    const work = await this.workModel.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('You are not the author of this work');
    }

    // 기존 표지 이미지가 있으면 파일 삭제
    if (work.coverImage) {
      const oldPath = path.join(
        __dirname,
        '..',
        '..',
        work.coverImage.replace(/^\//, ''),
      );
      try {
        await fs.promises.unlink(oldPath);
        this.logger.log(
          `works.updateCoverImage - 기존 파일 삭제: ${oldPath}`,
          'WorksService',
        );
      } catch (err) {
        this.logger.warn(
          `works.updateCoverImage - 기존 파일 삭제 실패 (무시): ${oldPath}, error: ${err.message}`,
          'WorksService',
        );
      }
    }

    const updated = await this.workModel.findByIdAndUpdate(
      workId,
      { coverImage: imagePath },
      { new: true },
    );
    this.logger.log(
      `works.updateCoverImage 성공 - workId: ${workId}, coverImage: ${imagePath}`,
      'WorksService',
    );
    return updated;
  }

  async updateBackgroundImage(
    workId: string,
    authorId: string,
    imagePath: string,
  ): Promise<WorkDocument> {
    this.logger.log(
      `works.updateBackgroundImage - workId: ${workId}, authorId: ${authorId}, imagePath: ${imagePath}`,
      'WorksService',
    );

    const work = await this.workModel.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('You are not the author of this work');
    }

    if (work.backgroundImage) {
      const oldPath = path.join(
        __dirname,
        '..',
        '..',
        work.backgroundImage.replace(/^\//, ''),
      );
      try {
        await fs.promises.unlink(oldPath);
        this.logger.log(
          `works.updateBackgroundImage - 기존 파일 삭제: ${oldPath}`,
          'WorksService',
        );
      } catch (err) {
        this.logger.warn(
          `works.updateBackgroundImage - 기존 파일 삭제 실패 (무시): ${oldPath}, error: ${err.message}`,
          'WorksService',
        );
      }
    }

    const updated = await this.workModel.findByIdAndUpdate(
      workId,
      { backgroundImage: imagePath },
      { new: true },
    );
    this.logger.log(
      `works.updateBackgroundImage 성공 - workId: ${workId}, backgroundImage: ${imagePath}`,
      'WorksService',
    );
    return updated;
  }

  async toggleLike(
    workId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    this.logger.log(
      `works.toggleLike - workId: ${workId}, userId: ${userId}`,
      'WorksService',
    );

    try {
      const workObjectId = new Types.ObjectId(workId);
      const userObjectId = new Types.ObjectId(userId);

      const work = await this.workModel.findById(workObjectId);
      if (!work) {
        throw new NotFoundException('Work not found');
      }

      const existing = await this.workLikeModel.findOne({
        workId: workObjectId,
        userId: userObjectId,
      });

      this.logger.debug(
        `works.toggleLike - existing: ${!!existing}`,
        'WorksService',
      );

      let liked: boolean;
      if (existing) {
        await this.workLikeModel.deleteOne({ _id: existing._id });
        await this.workModel.findByIdAndUpdate(workObjectId, {
          $inc: { 'stats.likeCount': -1 },
        });
        liked = false;
      } else {
        await this.workLikeModel.create({
          workId: workObjectId,
          userId: userObjectId,
        });
        await this.workModel.findByIdAndUpdate(workObjectId, {
          $inc: { 'stats.likeCount': 1 },
        });
        liked = true;
      }

      const updatedWork = await this.workModel.findById(workObjectId);
      const likeCount = updatedWork?.stats?.likeCount ?? 0;

      this.logger.log(
        `works.toggleLike 성공 - workId: ${workId}, liked: ${liked}, likeCount: ${likeCount}`,
        'WorksService',
      );

      return { liked, likeCount };
    } catch (error) {
      this.logger.error(
        `works.toggleLike 실패 - workId: ${workId}, userId: ${userId}: ${error.message}`,
        error.stack,
        'WorksService',
      );
      throw error;
    }
  }

  async isLiked(workId: string, userId: string): Promise<boolean> {
    this.logger.debug(
      `works.isLiked - workId: ${workId}, userId: ${userId}`,
      'WorksService',
    );
    const existing = await this.workLikeModel.findOne({
      workId: new Types.ObjectId(workId),
      userId: new Types.ObjectId(userId),
    });
    return !!existing;
  }
}
