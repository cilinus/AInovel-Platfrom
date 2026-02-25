import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, SortOrder } from 'mongoose';
import { Work, WorkDocument, WorkStatus } from '../common/schemas/work.schema';

interface ListOptions {
  genre?: string;
  status?: WorkStatus;
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
  ) {}

  async create(authorId: string, data: Partial<Work>): Promise<WorkDocument> {
    return this.workModel.create({ ...data, authorId });
  }

  async findById(id: string): Promise<WorkDocument> {
    const work = await this.workModel.findById(id).populate('authorId', 'nickname profileImage');
    if (!work) throw new NotFoundException('Work not found');
    return work;
  }

  async list(options: ListOptions) {
    const { genre, status, sort = '-createdAt', page = 1, limit = 20 } = options;
    const filter: FilterQuery<Work> = {};
    if (genre) filter.genre = genre;
    if (status) filter.status = status;
    else filter.status = { $in: [WorkStatus.ONGOING, WorkStatus.COMPLETED] };

    const sortMap: Record<string, Record<string, SortOrder>> = {
      '-createdAt': { createdAt: -1 },
      '-viewCount': { 'stats.viewCount': -1 },
      '-likeCount': { 'stats.likeCount': -1 },
    };

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .sort(sortMap[sort] ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'nickname'),
      this.workModel.countDocuments(filter),
    ]);

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
}
