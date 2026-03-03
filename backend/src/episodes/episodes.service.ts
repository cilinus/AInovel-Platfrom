import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Episode, EpisodeDocument } from '../common/schemas/episode.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { ReorderEpisodesDto } from './dto/reorder-episodes.dto';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EpisodesService {
  constructor(
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
    private readonly logger: LoggerService,
  ) {}

  async create(
    workId: string,
    authorId: string,
    dto: CreateEpisodeDto,
  ): Promise<EpisodeDocument> {
    this.logger.log(
      `episodes.create - workId: ${workId}, authorId: ${authorId}, dto keys: ${Object.keys(dto).join(', ')}`,
      'EpisodesService',
    );

    this.logger.debug(
      `episodes.create - workModel.findById: ${workId}`,
      'EpisodesService',
    );
    const work = await this.workModel.findById(workId);
    if (!work) {
      this.logger.warn(
        `episodes.create - work not found: ${workId}`,
        'EpisodesService',
      );
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      this.logger.warn(
        `episodes.create - forbidden: authorId=${authorId}, work.authorId=${work.authorId}`,
        'EpisodesService',
      );
      throw new ForbiddenException('Not the author of this work');
    }

    // isFree이면 price를 0으로 강제, 그렇지 않으면 dto.price 사용
    const price = dto.isFree ? 0 : (dto.price ?? 0);

    // 공백 제거한 실제 글자 수 계산
    const wordCount = dto.content.replace(/\s/g, '').length;

    // publishNow 처리
    const isPublished = dto.publishNow === true;
    const publishedAt = isPublished ? new Date() : undefined;

    // Insert-at-position: dto.episodeNumber가 지정되면 해당 위치에 삽입
    if (dto.episodeNumber !== undefined) {
      return this.createAtPosition(
        workId,
        work,
        dto,
        price,
        wordCount,
        isPublished,
        publishedAt,
      );
    }

    // 기본 동작: 끝에 추가
    const nextNumber = work.episodeCount + 1;

    const episodeData = {
      workId,
      episodeNumber: nextNumber,
      title: dto.title,
      content: dto.content,
      wordCount,
      isFree: dto.isFree ?? false,
      price,
      authorNote: dto.authorNote,
      isPublished,
      publishedAt,
    };

    this.logger.debug(
      `episodes.create - episodeModel.create: ${JSON.stringify({
        workId: episodeData.workId,
        episodeNumber: episodeData.episodeNumber,
        title: episodeData.title,
        wordCount: episodeData.wordCount,
        isFree: episodeData.isFree,
        price: episodeData.price,
        isPublished: episodeData.isPublished,
        hasAuthorNote: !!episodeData.authorNote,
      })}`,
      'EpisodesService',
    );

    try {
      const episode = await this.episodeModel.create(episodeData);
      this.logger.log(
        `episodes.create - 성공: _id=${episode._id}, episodeNumber=${nextNumber}`,
        'EpisodesService',
      );

      this.logger.debug(
        `episodes.create - workModel.findByIdAndUpdate: ${workId}, $inc episodeCount`,
        'EpisodesService',
      );
      await this.workModel.findByIdAndUpdate(workId, {
        $inc: { episodeCount: 1 },
      });

      return episode;
    } catch (error) {
      this.logger.error(
        `episodes.create - 실패: ${error.message}`,
        error.stack,
        'EpisodesService',
      );
      throw error;
    }
  }

  /**
   * 특정 위치에 에피소드를 삽입 (2-pass 음수 변환으로 유니크 인덱스 충돌 회피)
   * Note: 트랜잭션 없이 동작 (standalone MongoDB 호환).
   * 음수 값은 양수와 충돌하지 않으므로 2-pass 방식 자체가 안전.
   */
  private async createAtPosition(
    workId: string,
    work: WorkDocument,
    dto: CreateEpisodeDto,
    price: number,
    wordCount: number,
    isPublished: boolean,
    publishedAt: Date | undefined,
  ): Promise<EpisodeDocument> {
    const insertPos = dto.episodeNumber;
    const maxAllowed = work.episodeCount + 1;

    if (insertPos < 1 || insertPos > maxAllowed) {
      throw new BadRequestException(
        `episodeNumber must be between 1 and ${maxAllowed}`,
      );
    }

    this.logger.log(
      `episodes.createAtPosition - workId: ${workId}, insertPos: ${insertPos}`,
      'EpisodesService',
    );

    try {
      // Pass 1: 기존 에피소드 번호 >= insertPos -> 음수 임시값 -(episodeNumber + 1)
      this.logger.debug(
        `episodes.createAtPosition - Pass 1: shift episodes >= ${insertPos} to negative`,
        'EpisodesService',
      );
      await this.episodeModel.updateMany(
        { workId, episodeNumber: { $gte: insertPos } },
        [
          {
            $set: {
              episodeNumber: {
                $multiply: [{ $add: ['$episodeNumber', 1] }, -1],
              },
            },
          },
        ],
      );

      // 새 에피소드 생성
      const episodeData = {
        workId,
        episodeNumber: insertPos,
        title: dto.title,
        content: dto.content,
        wordCount,
        isFree: dto.isFree ?? false,
        price,
        authorNote: dto.authorNote,
        isPublished,
        publishedAt,
      };

      this.logger.debug(
        `episodes.createAtPosition - creating episode at position ${insertPos}`,
        'EpisodesService',
      );
      const episode = await this.episodeModel.create(episodeData);

      // Pass 2: 음수 -> 양수 복원
      this.logger.debug(
        `episodes.createAtPosition - Pass 2: restore negative numbers to positive`,
        'EpisodesService',
      );
      await this.episodeModel.updateMany(
        { workId, episodeNumber: { $lt: 0 } },
        [
          {
            $set: {
              episodeNumber: { $multiply: ['$episodeNumber', -1] },
            },
          },
        ],
      );

      // episodeCount 증가
      await this.workModel.findByIdAndUpdate(workId, {
        $inc: { episodeCount: 1 },
      });

      this.logger.log(
        `episodes.createAtPosition - 성공: _id=${episode._id}, position=${insertPos}`,
        'EpisodesService',
      );
      return episode;
    } catch (error) {
      this.logger.error(
        `episodes.createAtPosition - 실패: ${error.message}`,
        error.stack,
        'EpisodesService',
      );
      throw error;
    }
  }

  async update(
    episodeId: string,
    workId: string,
    authorId: string,
    dto: UpdateEpisodeDto,
  ): Promise<EpisodeDocument> {
    this.logger.log(
      `episodes.update - episodeId: ${episodeId}, workId: ${workId}, authorId: ${authorId}, dto keys: ${Object.keys(dto).join(', ')}`,
      'EpisodesService',
    );

    this.logger.debug(
      `episodes.update - episodeModel.findById: ${episodeId}`,
      'EpisodesService',
    );
    const episode = await this.episodeModel.findById(episodeId);
    if (!episode) {
      this.logger.error(
        `episodes.update - episode not found: ${episodeId}`,
        undefined,
        'EpisodesService',
      );
      throw new NotFoundException('Episode not found');
    }

    if (episode.workId.toString() !== workId) {
      this.logger.error(
        `episodes.update - workId mismatch: episode.workId=${episode.workId}, requested=${workId}`,
        undefined,
        'EpisodesService',
      );
      throw new NotFoundException('Episode not found in this work');
    }

    this.logger.debug(
      `episodes.update - workModel.findById: ${workId}`,
      'EpisodesService',
    );
    const work = await this.workModel.findById(workId);
    if (!work) {
      this.logger.error(
        `episodes.update - work not found: ${workId}`,
        undefined,
        'EpisodesService',
      );
      throw new NotFoundException('Work not found');
    }

    if (work.authorId.toString() !== authorId) {
      this.logger.error(
        `episodes.update - forbidden: authorId=${authorId}, work.authorId=${work.authorId}`,
        undefined,
        'EpisodesService',
      );
      throw new ForbiddenException('Not the author of this work');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) {
      updateData.content = dto.content;
      updateData.wordCount = dto.content.replace(/\s/g, '').length;
    }
    if (dto.authorNote !== undefined) updateData.authorNote = dto.authorNote;
    if (dto.isFree !== undefined) {
      updateData.isFree = dto.isFree;
      if (dto.isFree) {
        updateData.price = 0;
      }
    }
    if (dto.price !== undefined && !dto.isFree) {
      updateData.price = dto.price;
    }
    if (dto.publishNow === true && !episode.isPublished) {
      updateData.isPublished = true;
      updateData.publishedAt = new Date();
    }

    this.logger.debug(
      `episodes.update - findByIdAndUpdate: ${episodeId}, fields: ${Object.keys(updateData).join(', ')}`,
      'EpisodesService',
    );

    try {
      const updated = await this.episodeModel.findByIdAndUpdate(
        episodeId,
        { $set: updateData },
        { new: true },
      );
      this.logger.log(
        `episodes.update - success: _id=${updated._id}`,
        'EpisodesService',
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `episodes.update - failed: ${error.message}`,
        error.stack,
        'EpisodesService',
      );
      throw error;
    }
  }

  async listByWork(workId: string, page = 1, limit = 50) {
    const filter = { workId, isPublished: true };
    this.logger.debug(
      `episodes.listByWork - find: ${JSON.stringify(filter)}, page=${page}, limit=${limit}`,
      'EpisodesService',
    );

    const [items, total] = await Promise.all([
      this.episodeModel
        .find(filter)
        .sort({ episodeNumber: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content'),
      this.episodeModel.countDocuments(filter),
    ]);

    this.logger.debug(
      `episodes.listByWork - 결과: total=${total}, returned=${items.length}`,
      'EpisodesService',
    );

    return { items, total, page, limit };
  }

  async getNavigation(workId: string, episodeId: string) {
    this.logger.debug(
      `episodes.getNavigation - workId: ${workId}, episodeId: ${episodeId}`,
      'EpisodesService',
    );

    const current = await this.episodeModel
      .findById(episodeId)
      .select('episodeNumber');

    if (!current) {
      throw new NotFoundException('Episode not found');
    }

    const [prev, next] = await Promise.all([
      this.episodeModel
        .findOne({
          workId,
          isPublished: true,
          episodeNumber: { $lt: current.episodeNumber },
        })
        .sort({ episodeNumber: -1 })
        .select('_id episodeNumber title')
        .lean(),
      this.episodeModel
        .findOne({
          workId,
          isPublished: true,
          episodeNumber: { $gt: current.episodeNumber },
        })
        .sort({ episodeNumber: 1 })
        .select('_id episodeNumber title')
        .lean(),
    ]);

    this.logger.debug(
      `episodes.getNavigation - prev: ${prev?._id ?? 'none'}, next: ${next?._id ?? 'none'}`,
      'EpisodesService',
    );

    return {
      prev: prev ? { id: prev._id, number: prev.episodeNumber, title: prev.title } : null,
      next: next ? { id: next._id, number: next.episodeNumber, title: next.title } : null,
    };
  }

  async getContent(episodeId: string): Promise<EpisodeDocument> {
    this.logger.debug(
      `episodes.getContent - findById: ${episodeId}`,
      'EpisodesService',
    );

    const episode = await this.episodeModel.findById(episodeId);
    if (!episode) {
      this.logger.warn(
        `episodes.getContent - not found: ${episodeId}`,
        'EpisodesService',
      );
      throw new NotFoundException('Episode not found');
    }

    return episode;
  }

  /**
   * 전체 에피소드 순서 변경 (2-pass 음수 변환)
   */
  async reorder(
    workId: string,
    authorId: string,
    dto: ReorderEpisodesDto,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `episodes.reorder - workId: ${workId}, authorId: ${authorId}, orders: ${dto.orders.length}`,
      'EpisodesService',
    );

    // 작가 권한 확인
    const work = await this.workModel.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('Not the author of this work');
    }

    // 유효성: 모든 에피소드가 해당 work 소속인지 확인
    const allEpisodes = await this.episodeModel
      .find({ workId })
      .select('_id')
      .lean();

    const allIds = new Set(allEpisodes.map((e) => e._id.toString()));
    const orderIds = new Set(dto.orders.map((o) => o.episodeId));

    if (allIds.size !== orderIds.size) {
      throw new BadRequestException(
        `Expected ${allIds.size} episodes, got ${orderIds.size}`,
      );
    }

    for (const order of dto.orders) {
      if (!allIds.has(order.episodeId)) {
        throw new BadRequestException(
          `Episode ${order.episodeId} does not belong to this work`,
        );
      }
    }

    // 번호가 1~N 연속인지 확인
    const numbers = dto.orders.map((o) => o.episodeNumber).sort((a, b) => a - b);
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] !== i + 1) {
        throw new BadRequestException(
          `Episode numbers must be consecutive 1 to ${allIds.size}`,
        );
      }
    }

    try {
      // Pass 1: 모든 에피소드 번호를 음수로 설정
      this.logger.debug(
        `episodes.reorder - Pass 1: set all to negative`,
        'EpisodesService',
      );
      const pass1Ops = dto.orders.map((order) => ({
        updateOne: {
          filter: { _id: order.episodeId, workId },
          update: { $set: { episodeNumber: -order.episodeNumber } },
        },
      }));
      await this.episodeModel.bulkWrite(pass1Ops);

      // Pass 2: 음수 -> 양수 복원
      this.logger.debug(
        `episodes.reorder - Pass 2: restore to positive`,
        'EpisodesService',
      );
      await this.episodeModel.updateMany(
        { workId, episodeNumber: { $lt: 0 } },
        [
          {
            $set: {
              episodeNumber: { $multiply: ['$episodeNumber', -1] },
            },
          },
        ],
      );

      this.logger.log(
        `episodes.reorder - 성공: ${dto.orders.length} episodes reordered`,
        'EpisodesService',
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `episodes.reorder - 실패: ${error.message}`,
        error.stack,
        'EpisodesService',
      );
      throw error;
    }
  }

  /**
   * 작가용 전체 에피소드 목록 (isPublished 필터 없음)
   */
  async listAllByWork(
    workId: string,
    authorId: string,
    page = 1,
    limit = 100,
  ) {
    this.logger.debug(
      `episodes.listAllByWork - workId: ${workId}, authorId: ${authorId}, page=${page}, limit=${limit}`,
      'EpisodesService',
    );

    // 작가 권한 확인
    const work = await this.workModel.findById(workId);
    if (!work) {
      throw new NotFoundException('Work not found');
    }
    if (work.authorId.toString() !== authorId) {
      throw new ForbiddenException('Not the author of this work');
    }

    const filter = { workId };
    const [items, total] = await Promise.all([
      this.episodeModel
        .find(filter)
        .sort({ episodeNumber: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content'),
      this.episodeModel.countDocuments(filter),
    ]);

    this.logger.debug(
      `episodes.listAllByWork - 결과: total=${total}, returned=${items.length}`,
      'EpisodesService',
    );

    return { items, total, page, limit };
  }
}
