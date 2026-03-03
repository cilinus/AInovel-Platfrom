import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { WorkStatus } from '../common/schemas/work.schema';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Works')
@Controller()
export class WorksController {
  constructor(
    private readonly worksService: WorksService,
    private readonly logger: LoggerService,
  ) {}

  // -----------------------------------------------------------------------
  // Author routes (authenticated)
  // -----------------------------------------------------------------------

  @ApiBearerAuth()
  @Get('author/works')
  @ApiOperation({ summary: '내 작품 목록 조회 (작가)' })
  async myWorks(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.worksService.findByAuthor(userId, page, limit);
  }

  // -----------------------------------------------------------------------
  // Public work routes
  // -----------------------------------------------------------------------

  @Public()
  @Get('works')
  @ApiOperation({ summary: '작품 목록 조회' })
  @ApiQuery({ name: 'status', enum: WorkStatus, required: false })
  async list(
    @Query('genre') genre?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.worksService.list({ genre, status, sort, page, limit });
  }

  @Public()
  @Get('works/search')
  @ApiOperation({ summary: '작품 검색' })
  async search(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.worksService.search(query, page, limit);
  }

  @Public()
  @Get('works/:id')
  @ApiOperation({ summary: '작품 상세 조회' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
  ) {
    const work = await this.worksService.findById(id);
    await this.worksService.incrementView(id);
    const result = work.toObject();
    if (userId) {
      (result as any).isLiked = await this.worksService.isLiked(id, userId);
    }
    return result;
  }

  @ApiBearerAuth()
  @Post('works')
  @ApiOperation({ summary: '작품 생성' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() body: CreateWorkDto,
  ) {
    this.logger.log(
      `POST /works - userId: ${userId}, body: ${JSON.stringify(body)}`,
      'WorksController',
    );
    try {
      const result = await this.worksService.create(userId, body);
      this.logger.log(
        `POST /works - 성공: ${result._id}`,
        'WorksController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works - 실패: ${error.message}`,
        error.stack,
        'WorksController',
      );
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Like toggle
  // -----------------------------------------------------------------------

  @ApiBearerAuth()
  @Post('works/:id/like')
  @ApiOperation({ summary: '작품 좋아요 토글' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    this.logger.log(
      `POST /works/${id}/like - userId: ${userId}`,
      'WorksController',
    );
    try {
      const result = await this.worksService.toggleLike(id, userId);
      this.logger.log(
        `POST /works/${id}/like - 성공: liked=${result.liked}`,
        'WorksController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works/${id}/like - 실패: ${error.message}`,
        error.stack,
        'WorksController',
      );
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Update routes (authenticated)
  // -----------------------------------------------------------------------

  @ApiBearerAuth()
  @Patch('works/:id')
  @ApiOperation({ summary: '작품 정보 수정' })
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() body: UpdateWorkDto,
  ) {
    this.logger.log(
      `PATCH /works/${id} - userId: ${userId}, body: ${JSON.stringify(body)}`,
      'WorksController',
    );
    try {
      const result = await this.worksService.update(id, userId, body);
      this.logger.log(
        `PATCH /works/${id} - 성공`,
        'WorksController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `PATCH /works/${id} - 실패: ${error.message}`,
        error.stack,
        'WorksController',
      );
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('works/:id/cover')
  @ApiOperation({ summary: '작품 표지 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        coverImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('coverImage', {
      storage: diskStorage({
        destination: 'uploads/covers',
        filename: (_req, file, cb) => {
          const workId = _req.params.id;
          const ext = extname(file.originalname);
          cb(null, `${workId}-${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(
            new BadRequestException(
              'Only image files (jpeg, png, gif, webp) are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadCover(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Cover image file is required');
    }

    this.logger.log(
      `POST /works/${id}/cover - userId: ${userId}, file: ${file.filename}`,
      'WorksController',
    );

    try {
      const imagePath = `/uploads/covers/${file.filename}`;
      const result = await this.worksService.updateCoverImage(
        id,
        userId,
        imagePath,
      );
      this.logger.log(
        `POST /works/${id}/cover - 성공: ${imagePath}`,
        'WorksController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works/${id}/cover - 실패: ${error.message}`,
        error.stack,
        'WorksController',
      );
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('works/:id/background')
  @ApiOperation({ summary: '작품 바탕 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        backgroundImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('backgroundImage', {
      storage: diskStorage({
        destination: 'uploads/backgrounds',
        filename: (_req, file, cb) => {
          const workId = _req.params.id;
          const ext = extname(file.originalname);
          cb(null, `${workId}-${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(
            new BadRequestException(
              'Only image files (jpeg, png, gif, webp) are allowed',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadBackground(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Background image file is required');
    }

    this.logger.log(
      `POST /works/${id}/background - userId: ${userId}, file: ${file.filename}`,
      'WorksController',
    );

    try {
      const imagePath = `/uploads/backgrounds/${file.filename}`;
      const result = await this.worksService.updateBackgroundImage(
        id,
        userId,
        imagePath,
      );
      this.logger.log(
        `POST /works/${id}/background - 성공: ${imagePath}`,
        'WorksController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works/${id}/background - 실패: ${error.message}`,
        error.stack,
        'WorksController',
      );
      throw error;
    }
  }
}
