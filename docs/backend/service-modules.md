# 핵심 서비스 모듈 설계서

## 1. 개요

각 서비스 모듈의 비즈니스 로직, 핵심 메서드 시그니처, BullMQ 비동기 작업 처리를 정의한다.
모든 서비스는 NestJS DI 컨테이너에서 관리되며, Mongoose 모델을 통해 MongoDB에 접근한다.

---

## 2. WorksService

작품 CRUD 및 검색/필터/정렬 기능 담당.

### Mongoose 스키마

```typescript
// src/modules/works/schemas/work.schema.ts
export enum Genre {
  FANTASY = 'fantasy',
  ROMANCE = 'romance',
  ACTION = 'action',
  THRILLER = 'thriller',
  SF = 'sf',
  HORROR = 'horror',
  MYSTERY = 'mystery',
  SLICE_OF_LIFE = 'slice_of_life',
  HISTORICAL = 'historical',
}

export enum WorkStatus {
  DRAFT = 'draft',
  PENDING = 'pending',       // 관리자 승인 대기
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
  SUSPENDED = 'suspended',   // 관리자 정지
}

@modelOptions({ schemaOptions: { timestamps: true, collection: 'works' } })
@index({ title: 'text', description: 'text', tags: 'text' }) // 텍스트 검색
@index({ genre: 1, status: 1, createdAt: -1 })               // 장르+상태 필터
@index({ 'stats.avgRating': -1 })                             // 평점 정렬
export class Work {
  _id: Types.ObjectId;

  @prop({ required: true, maxlength: 100 })
  title: string;

  @prop({ required: true, maxlength: 2000 })
  description: string;

  @prop({ required: true, ref: () => User, index: true })
  authorId: Ref<User>;

  @prop({ required: true, enum: Genre })
  genre: Genre;

  @prop({ type: () => [String], default: [] })
  tags: string[];

  @prop({ default: '' })
  coverImageUrl: string;

  @prop({ required: true, enum: WorkStatus, default: WorkStatus.DRAFT })
  status: WorkStatus;

  @prop({ enum: ['ALL', '15+', '19+'], default: 'ALL' })
  ageRating: string;

  @prop({ default: false })
  isAIGenerated: boolean;

  @prop({ type: () => WorkStats, default: {} })
  stats: WorkStats;
}

class WorkStats {
  @prop({ default: 0 })
  views: number;

  @prop({ default: 0 })
  likes: number;

  @prop({ default: 0 })
  totalRatingSum: number;

  @prop({ default: 0 })
  ratingCount: number;

  @prop({ default: 0 })
  avgRating: number;

  @prop({ default: 0 })
  episodeCount: number;
}
```

### 서비스 메서드

```typescript
// src/modules/works/works.service.ts
@Injectable()
export class WorksService {
  constructor(
    @InjectModel(Work) private workModel: ReturnModelType<typeof Work>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(authorId: string, dto: CreateWorkDto): Promise<Work> {
    return this.workModel.create({ ...dto, authorId, status: WorkStatus.DRAFT });
  }

  async findAll(query: WorksQueryDto): Promise<PaginatedResult<Work>> {
    const { page = 1, limit = 20, genre, sort = 'latest', status, keyword } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Work> = { status: status ?? WorkStatus.ONGOING };
    if (genre) filter.genre = genre;
    if (keyword) filter.$text = { $search: keyword };

    const sortMap: Record<string, Record<string, SortOrder>> = {
      latest: { createdAt: -1 },
      popular: { 'stats.views': -1 },
      rating: { 'stats.avgRating': -1 },
    };

    const [items, total] = await Promise.all([
      this.workModel
        .find(filter)
        .sort(sortMap[sort])
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'nickname avatarUrl')
        .lean(),
      this.workModel.countDocuments(filter),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Work> {
    const cacheKey = `work:${id}`;
    const cached = await this.cacheManager.get<Work>(cacheKey);
    if (cached) return cached;

    const work = await this.workModel
      .findById(id)
      .populate('authorId', 'nickname avatarUrl bio')
      .lean();
    if (!work) throw new NotFoundException('작품을 찾을 수 없습니다.');

    await this.cacheManager.set(cacheKey, work, 300); // 5분 캐시
    return work;
  }

  async incrementViews(id: string): Promise<void> {
    await this.workModel.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } });
    await this.cacheManager.del(`work:${id}`);
  }

  async rateWork(
    userId: string,
    workId: string,
    score: number,
  ): Promise<{ avgRating: number }> {
    // Rating 컬렉션에 upsert → Work.stats 재계산
    await this.ratingModel.findOneAndUpdate(
      { userId, workId },
      { score },
      { upsert: true },
    );

    const result = await this.ratingModel.aggregate([
      { $match: { workId: new Types.ObjectId(workId) } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const { avg, count } = result[0];
    await this.workModel.findByIdAndUpdate(workId, {
      'stats.avgRating': Math.round(avg * 10) / 10,
      'stats.ratingCount': count,
      'stats.totalRatingSum': Math.round(avg * count),
    });

    await this.cacheManager.del(`work:${workId}`);
    return { avgRating: Math.round(avg * 10) / 10 };
  }

  async update(authorId: string, id: string, dto: UpdateWorkDto): Promise<Work> {
    const work = await this.workModel.findOneAndUpdate(
      { _id: id, authorId },
      { $set: dto },
      { new: true },
    );
    if (!work) throw new NotFoundException('작품을 찾을 수 없거나 권한이 없습니다.');
    await this.cacheManager.del(`work:${id}`);
    return work;
  }

  async delete(authorId: string, id: string): Promise<void> {
    const result = await this.workModel.findOneAndDelete({ _id: id, authorId });
    if (!result) throw new NotFoundException('작품을 찾을 수 없거나 권한이 없습니다.');
    await this.cacheManager.del(`work:${id}`);
  }
}
```

---

## 3. EpisodesService

회차 생성, 발행, 예약 발행, 열람 기능 담당.

### Mongoose 스키마

```typescript
@modelOptions({ schemaOptions: { timestamps: true, collection: 'episodes' } })
@index({ workId: 1, episodeNumber: 1 }, { unique: true })
@index({ workId: 1, status: 1, publishedAt: -1 })
export class Episode {
  _id: Types.ObjectId;

  @prop({ required: true, ref: () => Work, index: true })
  workId: Ref<Work>;

  @prop({ required: true, maxlength: 100 })
  title: string;

  @prop({ required: true })
  content: string;             // 본문 (암호화 저장 고려)

  @prop({ required: true, min: 1 })
  episodeNumber: number;

  @prop({ default: 0 })
  wordCount: number;

  @prop({ maxlength: 500, default: '' })
  authorNote: string;

  @prop({ default: false })
  isFree: boolean;

  @prop({ default: 3, min: 0, max: 100 })
  tokenPrice: number;

  @prop({ enum: ['draft', 'published', 'scheduled'], default: 'draft' })
  status: string;

  @prop()
  publishedAt?: Date;

  @prop()
  scheduledAt?: Date;           // 예약 발행 시각
}
```

### 서비스 메서드

```typescript
@Injectable()
export class EpisodesService {
  constructor(
    @InjectModel(Episode) private episodeModel: ReturnModelType<typeof Episode>,
    @InjectModel(Work) private workModel: ReturnModelType<typeof Work>,
    @InjectModel(Purchase) private purchaseModel: ReturnModelType<typeof Purchase>,
    @InjectQueue('episode') private episodeQueue: Queue,
  ) {}

  async create(authorId: string, workId: string, dto: CreateEpisodeDto): Promise<Episode> {
    // 작품 소유 확인
    const work = await this.workModel.findOne({ _id: workId, authorId });
    if (!work) throw new ForbiddenException('해당 작품의 작가만 회차를 등록할 수 있습니다.');

    const episode = await this.episodeModel.create({
      ...dto,
      workId,
      wordCount: dto.content.length,
      status: 'draft',
    });

    // 작품 에피소드 수 업데이트
    await this.workModel.findByIdAndUpdate(workId, {
      $inc: { 'stats.episodeCount': 1 },
    });

    return episode;
  }

  async publish(authorId: string, episodeId: string): Promise<Episode> {
    const episode = await this.episodeModel.findById(episodeId).populate('workId');
    if (!episode) throw new NotFoundException();
    if ((episode.workId as Work).authorId.toString() !== authorId) {
      throw new ForbiddenException();
    }

    episode.status = 'published';
    episode.publishedAt = new Date();
    await episode.save();

    // 알림 큐에 등록 (BullMQ)
    await this.episodeQueue.add('new-episode-notification', {
      workId: episode.workId._id,
      episodeId: episode._id,
      episodeNumber: episode.episodeNumber,
    });

    return episode;
  }

  async schedule(authorId: string, episodeId: string, scheduledAt: Date): Promise<Episode> {
    const episode = await this.episodeModel.findById(episodeId).populate('workId');
    if (!episode) throw new NotFoundException();

    episode.status = 'scheduled';
    episode.scheduledAt = scheduledAt;
    await episode.save();

    // 예약 발행 스케줄링 (BullMQ delayed job)
    const delay = scheduledAt.getTime() - Date.now();
    await this.episodeQueue.add(
      'scheduled-publish',
      { episodeId: episode._id },
      { delay, jobId: `schedule:${episode._id}` },
    );

    return episode;
  }

  async getContent(userId: string, episodeId: string): Promise<EpisodeContent> {
    const episode = await this.episodeModel.findById(episodeId);
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다.');

    // 무료 회차 또는 구매 확인
    if (!episode.isFree) {
      const purchased = await this.purchaseModel.exists({ userId, episodeId });
      if (!purchased) {
        throw new ForbiddenException('구매 후 열람 가능합니다.');
      }
    }

    // 이전/다음 회차 ID
    const [prev, next] = await Promise.all([
      this.episodeModel.findOne({
        workId: episode.workId,
        episodeNumber: episode.episodeNumber - 1,
        status: 'published',
      }).select('_id'),
      this.episodeModel.findOne({
        workId: episode.workId,
        episodeNumber: episode.episodeNumber + 1,
        status: 'published',
      }).select('_id'),
    ]);

    return {
      ...episode.toObject(),
      prevEpisodeId: prev?._id ?? null,
      nextEpisodeId: next?._id ?? null,
    };
  }
}
```

---

## 4. AIService + BullMQ 작업 처리

### 서비스 메서드

```typescript
// src/modules/ai/ai.service.ts
@Injectable()
export class AIService {
  constructor(
    @InjectQueue('ai-generation') private aiQueue: Queue,
    @InjectModel(AIJob) private aiJobModel: ReturnModelType<typeof AIJob>,
  ) {}

  async requestGeneration(authorId: string, dto: GenerateNovelDto): Promise<{ jobId: string }> {
    // 일일 생성 횟수 제한 확인
    const todayCount = await this.aiJobModel.countDocuments({
      authorId,
      createdAt: { $gte: startOfDay(new Date()) },
    });
    if (todayCount >= 20) {
      throw new TooManyRequestsException('일일 AI 생성 한도를 초과했습니다.');
    }

    // DB에 작업 레코드 생성
    const aiJob = await this.aiJobModel.create({
      authorId,
      workId: dto.workId,
      prompt: dto.prompt,
      genre: dto.genre,
      style: dto.style,
      length: dto.length,
      status: 'queued',
      progress: 0,
    });

    // BullMQ 큐에 작업 추가
    await this.aiQueue.add(
      'generate-novel',
      {
        jobId: aiJob._id.toString(),
        prompt: dto.prompt,
        genre: dto.genre,
        style: dto.style,
        length: dto.length,
        previousEpisodeId: dto.previousEpisodeId,
        temperature: dto.temperature ?? 0.7,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return { jobId: aiJob._id.toString() };
  }

  async checkStatus(authorId: string, jobId: string): Promise<AIJobStatus> {
    const job = await this.aiJobModel.findOne({ _id: jobId, authorId });
    if (!job) throw new NotFoundException('작업을 찾을 수 없습니다.');

    return {
      jobId: job._id.toString(),
      status: job.status,
      progress: job.progress,
      result: job.status === 'completed'
        ? { content: job.resultContent, wordCount: job.resultWordCount }
        : undefined,
      error: job.status === 'failed' ? job.errorMessage : undefined,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }
}
```

### AIJob 스키마

```typescript
@modelOptions({ schemaOptions: { timestamps: true, collection: 'ai_jobs' } })
export class AIJob {
  _id: Types.ObjectId;

  @prop({ required: true, ref: () => User, index: true })
  authorId: Ref<User>;

  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ required: true })
  prompt: string;

  @prop({ enum: Genre })
  genre: Genre;

  @prop()
  style: string;

  @prop()
  length: string;

  @prop({ enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' })
  status: string;

  @prop({ default: 0, min: 0, max: 100 })
  progress: number;

  @prop()
  resultContent?: string;

  @prop()
  resultWordCount?: number;

  @prop()
  errorMessage?: string;

  @prop()
  completedAt?: Date;

  createdAt: Date;
}
```

### BullMQ Processor

```typescript
// src/modules/ai/processors/ai-generation.processor.ts
@Processor('ai-generation')
export class AIGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AIGenerationProcessor.name);

  constructor(
    @InjectModel(AIJob) private aiJobModel: ReturnModelType<typeof AIJob>,
    private readonly openaiService: OpenAIService,
  ) {
    super();
  }

  async process(job: Job<AIGenerationJobData>): Promise<AIGenerationResult> {
    const { jobId, prompt, genre, style, length, previousEpisodeId, temperature } = job.data;

    try {
      // 1. 상태 업데이트: processing
      await this.aiJobModel.findByIdAndUpdate(jobId, {
        status: 'processing',
        progress: 10,
      });

      // 2. 이전 회차 컨텍스트 로드
      let context = '';
      if (previousEpisodeId) {
        const prevEpisode = await this.episodeModel.findById(previousEpisodeId);
        context = prevEpisode?.content?.slice(-2000) ?? '';
      }

      await this.updateProgress(jobId, 20);

      // 3. AI 모델 호출 (프롬프트 구성)
      const targetLength = { short: 2000, medium: 4000, long: 8000 }[length];
      const systemPrompt = this.buildSystemPrompt(genre, style, targetLength);

      await this.updateProgress(jobId, 30);

      const result = await this.openaiService.generateNovel({
        systemPrompt,
        userPrompt: prompt,
        context,
        temperature,
        maxTokens: targetLength * 2,
      });

      await this.updateProgress(jobId, 80);

      // 4. 후처리 (포맷팅, 검수)
      const processedContent = this.postProcess(result.content);
      const wordCount = processedContent.length;

      // 5. 완료 상태 업데이트
      await this.aiJobModel.findByIdAndUpdate(jobId, {
        status: 'completed',
        progress: 100,
        resultContent: processedContent,
        resultWordCount: wordCount,
        completedAt: new Date(),
      });

      return { content: processedContent, wordCount };
    } catch (error) {
      this.logger.error(`AI 생성 실패: ${jobId}`, error.stack);

      await this.aiJobModel.findByIdAndUpdate(jobId, {
        status: 'failed',
        errorMessage: error.message,
      });

      throw error; // BullMQ가 재시도 처리
    }
  }

  private async updateProgress(jobId: string, progress: number): Promise<void> {
    await this.aiJobModel.findByIdAndUpdate(jobId, { progress });
  }

  private buildSystemPrompt(genre: string, style: string, targetLength: number): string {
    return `당신은 한국어 ${genre} 장르의 웹소설 작가입니다.
문체: ${style === 'literary' ? '문학적이고 서정적인' : style === 'web_novel' ? '웹소설 특유의 경쾌한' : '라이트노벨 스타일의'} 문체로 작성하세요.
분량: 약 ${targetLength}자 내외로 작성하세요.
규칙: 자연스러운 한국어, 적절한 문단 나누기, 대화체 포함.`;
  }

  private postProcess(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')    // 연속 빈 줄 정리
      .replace(/^\s+|\s+$/g, '')       // 앞뒤 공백 제거
      .trim();
  }
}
```

---

## 5. UsersService

사용자 프로필, 라이브러리(구매 목록), 북마크 관리.

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: ReturnModelType<typeof User>,
    @InjectModel(Purchase) private purchaseModel: ReturnModelType<typeof Purchase>,
    @InjectModel(Bookmark) private bookmarkModel: ReturnModelType<typeof Bookmark>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password');
  }

  async findBySocial(provider: string, providerId: string): Promise<User | null> {
    return this.userModel.findOne({
      'socialAccounts.provider': provider,
      'socialAccounts.providerId': providerId,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: dto },
      { new: true, runValidators: true },
    ).select('-password');
    if (!user) throw new NotFoundException();
    return user;
  }

  async getLibrary(
    userId: string,
    query: PaginationDto,
  ): Promise<PaginatedResult<LibraryItem>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.purchaseModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'episodeId',
          select: 'title episodeNumber',
        })
        .populate({
          path: 'workId',
          select: 'title coverImageUrl',
        })
        .lean(),
      this.purchaseModel.countDocuments({ userId }),
    ]);

    return {
      items: items.map((p) => ({
        episodeId: p.episodeId._id,
        workId: p.workId._id,
        workTitle: (p.workId as Work).title,
        episodeNumber: (p.episodeId as Episode).episodeNumber,
        episodeTitle: (p.episodeId as Episode).title,
        purchasedAt: p.createdAt.toISOString(),
        lastReadAt: null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createSocialUser(info: SocialUserInfo): Promise<User> {
    return this.userModel.create({
      email: info.email,
      nickname: info.nickname || `user_${Date.now()}`,
      avatarUrl: info.avatarUrl || '',
      roles: [Role.USER],
      socialAccounts: [{ provider: info.provider, providerId: info.providerId }],
      tokenBalance: 0,
    });
  }

  async requestAuthorRole(userId: string, dto: AuthorRequestDto): Promise<void> {
    // 작가 신청 → Admin 승인 후 역할 부여
    await this.authorRequestModel.create({
      userId,
      realName: dto.realName,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      status: 'pending',
    });
  }
}
```

---

## 6. BullMQ 큐 구성

| 큐 이름 | 작업 유형 | 동시성 | 재시도 |
|----------|-----------|--------|--------|
| `ai-generation` | AI 소설 생성 | 5 | 3회 (지수 백오프) |
| `episode` | 예약 발행, 신규 알림 | 10 | 2회 |
| `notification` | 푸시/이메일 알림 | 20 | 3회 |
| `settlement` | 정산 배치 처리 | 1 | 1회 |

```typescript
// src/modules/ai/ai.module.ts
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'ai-generation', defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } } },
    ),
  ],
  controllers: [AIController],
  providers: [AIService, AIGenerationProcessor, OpenAIService],
})
export class AIModule {}

// src/modules/notification/notification.processor.ts
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  async process(job: Job<NotificationJobData>): Promise<void> {
    switch (job.name) {
      case 'new-episode-notification':
        await this.sendNewEpisodeNotification(job.data);
        break;
      case 'settlement-complete':
        await this.sendSettlementNotification(job.data);
        break;
    }
  }

  private async sendNewEpisodeNotification(data: NewEpisodeNotificationData): Promise<void> {
    // 해당 작품 북마크 사용자에게 알림
    const bookmarks = await this.bookmarkModel.find({ workId: data.workId }).lean();
    const userIds = bookmarks.map((b) => b.userId);

    for (const userId of userIds) {
      await this.notificationModel.create({
        userId,
        type: 'NEW_EPISODE',
        title: '새 회차 알림',
        message: `북마크한 작품의 ${data.episodeNumber}화가 공개되었습니다.`,
        metadata: { workId: data.workId, episodeId: data.episodeId },
      });
    }
  }
}
```

---

## 7. 공통 인터페이스

```typescript
// src/common/interfaces/paginated-result.interface.ts
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// src/common/dto/pagination.dto.ts
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
```
