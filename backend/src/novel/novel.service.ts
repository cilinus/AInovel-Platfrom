import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from '../logger/logger.service';
import { NovelProject, NovelProjectDocument } from './schemas/novel-project.schema';
import { NovelChapter, NovelChapterDocument } from './schemas/novel-chapter.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { UpdateOutlineDto } from './dto/update-outline.dto';
import { OutlineGeneratorAgent } from './agents/outline-generator.agent';
import { ProjectStatus, PlotOutlineItem } from './types/novel.types';

@Injectable()
export class NovelService {
  constructor(
    @InjectModel(NovelProject.name) private projectModel: Model<NovelProjectDocument>,
    @InjectModel(NovelChapter.name) private chapterModel: Model<NovelChapterDocument>,
    private readonly outlineGeneratorAgent: OutlineGeneratorAgent,
    private readonly logger: LoggerService,
  ) {}

  // -----------------------------------------------------------------------
  // Project CRUD
  // -----------------------------------------------------------------------

  async createProject(userId: string, dto: CreateProjectDto): Promise<NovelProjectDocument> {
    this.logger.debug(
      `novel.createProject - userId: ${userId}, title: ${dto.title}, genre: ${dto.genre}`,
      'NovelService',
    );

    const project = await this.projectModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      genre: dto.genre,
      subGenre: dto.subGenre,
      synopsis: dto.synopsis,
      targetAudience: dto.targetAudience,
      writingStyle: dto.writingStyle ?? { tone: 'formal', perspective: 'third_person_limited' },
      settings: dto.settings ?? { mainCharacters: [], worldBuilding: '' },
    });

    this.logger.log(
      `novel.createProject - success: projectId=${project._id}`,
      'NovelService',
    );
    return project;
  }

  async getProjects(userId: string, page = 1, limit = 20) {
    this.logger.debug(
      `novel.getProjects - userId: ${userId}, page: ${page}, limit: ${limit}`,
      'NovelService',
    );

    const filter = { userId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.projectModel.countDocuments(filter),
    ]);

    this.logger.debug(
      `novel.getProjects - found ${items.length} of ${total}`,
      'NovelService',
    );
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProject(projectId: string, userId: string): Promise<NovelProjectDocument> {
    this.logger.debug(
      `novel.getProject - projectId: ${projectId}, userId: ${userId}`,
      'NovelService',
    );

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.error(
        `novel.getProject - not found: ${projectId}`,
        undefined,
        'NovelService',
      );
      throw new NotFoundException('Project not found');
    }
    if (project.userId.toString() !== userId) {
      this.logger.error(
        `novel.getProject - forbidden: userId=${userId}, ownerId=${project.userId}`,
        undefined,
        'NovelService',
      );
      throw new ForbiddenException('You are not the owner of this project');
    }

    return project;
  }

  async updateProject(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<NovelProjectDocument> {
    this.logger.debug(
      `novel.updateProject - projectId: ${projectId}, userId: ${userId}, data: ${JSON.stringify(dto)}`,
      'NovelService',
    );

    const project = await this.getProject(projectId, userId);

    const updated = await this.projectModel.findByIdAndUpdate(
      project._id,
      { $set: dto },
      { new: true },
    );

    this.logger.log(
      `novel.updateProject - success: projectId=${projectId}`,
      'NovelService',
    );
    return updated;
  }

  async archiveProject(projectId: string, userId: string): Promise<NovelProjectDocument> {
    this.logger.debug(
      `novel.archiveProject - projectId: ${projectId}, userId: ${userId}`,
      'NovelService',
    );

    const project = await this.getProject(projectId, userId);

    const updated = await this.projectModel.findByIdAndUpdate(
      project._id,
      { status: ProjectStatus.ARCHIVED },
      { new: true },
    );

    this.logger.log(
      `novel.archiveProject - success: projectId=${projectId}`,
      'NovelService',
    );
    return updated;
  }

  // -----------------------------------------------------------------------
  // Plot Outline
  // -----------------------------------------------------------------------

  async getOutline(projectId: string, userId: string): Promise<PlotOutlineItem[]> {
    this.logger.debug(
      `novel.getOutline - projectId: ${projectId}, userId: ${userId}`,
      'NovelService',
    );

    const project = await this.getProject(projectId, userId);
    return project.plotOutline ?? [];
  }

  async updateOutline(
    projectId: string,
    userId: string,
    dto: UpdateOutlineDto,
  ): Promise<PlotOutlineItem[]> {
    this.logger.debug(
      `novel.updateOutline - projectId: ${projectId}, userId: ${userId}, items: ${dto.plotOutline.length}`,
      'NovelService',
    );

    const project = await this.getProject(projectId, userId);

    const updated = await this.projectModel.findByIdAndUpdate(
      project._id,
      { plotOutline: dto.plotOutline },
      { new: true },
    );

    this.logger.log(
      `novel.updateOutline - success: projectId=${projectId}, items=${updated.plotOutline.length}`,
      'NovelService',
    );
    return updated.plotOutline;
  }

  async generateOutline(
    projectId: string,
    userId: string,
    totalChapters: number,
  ): Promise<PlotOutlineItem[]> {
    this.logger.debug(
      `novel.generateOutline - projectId: ${projectId}, userId: ${userId}, totalChapters: ${totalChapters}`,
      'NovelService',
    );

    const project = await this.getProject(projectId, userId);

    const outline = await this.outlineGeneratorAgent.generate(
      project.synopsis,
      project.genre,
      totalChapters,
    );

    const updated = await this.projectModel.findByIdAndUpdate(
      project._id,
      { plotOutline: outline },
      { new: true },
    );

    this.logger.log(
      `novel.generateOutline - success: projectId=${projectId}, items=${updated.plotOutline.length}`,
      'NovelService',
    );
    return updated.plotOutline;
  }

  // -----------------------------------------------------------------------
  // Chapter CRUD
  // -----------------------------------------------------------------------

  async getChapters(projectId: string, userId: string) {
    this.logger.debug(
      `novel.getChapters - projectId: ${projectId}, userId: ${userId}`,
      'NovelService',
    );

    // Validate ownership
    await this.getProject(projectId, userId);

    const chapters = await this.chapterModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ chapterNumber: 1 })
      .select('chapterNumber title status wordCount aiMetadata.tokenCost createdAt')
      .lean();

    this.logger.debug(
      `novel.getChapters - found ${chapters.length} chapters`,
      'NovelService',
    );
    return chapters;
  }

  async getChapter(projectId: string, chapterNumber: number, userId: string) {
    this.logger.debug(
      `novel.getChapter - projectId: ${projectId}, chapterNumber: ${chapterNumber}, userId: ${userId}`,
      'NovelService',
    );

    // Validate ownership
    await this.getProject(projectId, userId);

    const chapter = await this.chapterModel.findOne({
      projectId: new Types.ObjectId(projectId),
      chapterNumber,
    });
    if (!chapter) {
      this.logger.error(
        `novel.getChapter - not found: projectId=${projectId}, chapterNumber=${chapterNumber}`,
        undefined,
        'NovelService',
      );
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  async updateChapterContent(
    projectId: string,
    chapterNumber: number,
    userId: string,
    content: string,
  ) {
    this.logger.debug(
      `novel.updateChapterContent - projectId: ${projectId}, chapterNumber: ${chapterNumber}, userId: ${userId}`,
      'NovelService',
    );

    // Validate ownership
    await this.getProject(projectId, userId);

    const wordCount = content.replace(/\s/g, '').length;

    const chapter = await this.chapterModel.findOneAndUpdate(
      { projectId: new Types.ObjectId(projectId), chapterNumber },
      { content, wordCount },
      { new: true },
    );
    if (!chapter) {
      this.logger.error(
        `novel.updateChapterContent - chapter not found: projectId=${projectId}, chapterNumber=${chapterNumber}`,
        undefined,
        'NovelService',
      );
      throw new NotFoundException('Chapter not found');
    }

    this.logger.log(
      `novel.updateChapterContent - success: chapterNumber=${chapterNumber}, wordCount=${wordCount}`,
      'NovelService',
    );
    return chapter;
  }

  async updateChapterTitle(
    projectId: string,
    chapterNumber: number,
    userId: string,
    title: string,
  ) {
    this.logger.debug(
      `novel.updateChapterTitle - projectId: ${projectId}, chapterNumber: ${chapterNumber}, title: ${title}`,
      'NovelService',
    );

    await this.getProject(projectId, userId);

    const chapter = await this.chapterModel.findOneAndUpdate(
      { projectId: new Types.ObjectId(projectId), chapterNumber },
      { title },
      { new: true },
    );
    if (!chapter) {
      this.logger.error(
        `novel.updateChapterTitle - chapter not found: projectId=${projectId}, chapterNumber=${chapterNumber}`,
        undefined,
        'NovelService',
      );
      throw new NotFoundException('Chapter not found');
    }

    this.logger.log(
      `novel.updateChapterTitle - success: chapterNumber=${chapterNumber}`,
      'NovelService',
    );
    return chapter;
  }

  async downloadChapter(
    projectId: string,
    chapterNumber: number,
    userId: string,
  ): Promise<{ markdown: string; title: string }> {
    this.logger.debug(
      `novel.downloadChapter - projectId: ${projectId}, chapterNumber: ${chapterNumber}, userId: ${userId}`,
      'NovelService',
    );

    const chapter = await this.getChapter(projectId, chapterNumber, userId);
    const title = chapter.title || `Chapter ${chapterNumber}`;
    const markdown = `# ${title}\n\n${chapter.content}`;

    this.logger.log(
      `novel.downloadChapter - success: chapterNumber=${chapterNumber}, length=${markdown.length}`,
      'NovelService',
    );
    return { markdown, title };
  }

  async deleteChapter(projectId: string, chapterNumber: number, userId: string) {
    this.logger.debug(
      `novel.deleteChapter - projectId: ${projectId}, chapterNumber: ${chapterNumber}, userId: ${userId}`,
      'NovelService',
    );

    // Validate ownership
    const project = await this.getProject(projectId, userId);

    const chapter = await this.chapterModel.findOneAndDelete({
      projectId: new Types.ObjectId(projectId),
      chapterNumber,
    });
    if (!chapter) {
      this.logger.error(
        `novel.deleteChapter - chapter not found: projectId=${projectId}, chapterNumber=${chapterNumber}`,
        undefined,
        'NovelService',
      );
      throw new NotFoundException('Chapter not found');
    }

    // Update project stats
    await this.projectModel.findByIdAndUpdate(project._id, {
      $inc: {
        totalChapters: -1,
        totalWordCount: -chapter.wordCount,
      },
    });

    this.logger.log(
      `novel.deleteChapter - success: projectId=${projectId}, chapterNumber=${chapterNumber}`,
      'NovelService',
    );
    return { deleted: true };
  }
}
