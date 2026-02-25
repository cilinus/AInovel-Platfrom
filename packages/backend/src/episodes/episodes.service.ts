import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Episode, EpisodeDocument } from '../common/schemas/episode.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
  ) {}

  async create(
    workId: string,
    authorId: string,
    data: Partial<Episode>,
  ): Promise<EpisodeDocument> {
    const work = await this.workModel.findById(workId);
    if (!work) throw new NotFoundException('Work not found');
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('Not the author of this work');
    }

    const nextNumber = work.episodeCount + 1;
    const episode = await this.episodeModel.create({
      ...data,
      workId,
      episodeNumber: nextNumber,
      wordCount: data.content?.length ?? 0,
    });

    await this.workModel.findByIdAndUpdate(workId, {
      $inc: { episodeCount: 1 },
    });

    return episode;
  }

  async listByWork(workId: string, page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.episodeModel
        .find({ workId, isPublished: true })
        .sort({ episodeNumber: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content'),
      this.episodeModel.countDocuments({ workId, isPublished: true }),
    ]);
    return { items, total, page, limit };
  }

  async getContent(episodeId: string): Promise<EpisodeDocument> {
    const episode = await this.episodeModel.findById(episodeId);
    if (!episode) throw new NotFoundException('Episode not found');
    return episode;
  }
}
