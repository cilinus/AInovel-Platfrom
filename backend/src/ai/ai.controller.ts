import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  @ApiOperation({ summary: 'AI 소설 생성 요청' })
  async generate(
    @CurrentUser('userId') userId: string,
    @Body()
    body: {
      workId: string;
      genre: string;
      prompt: string;
      previousContext?: string;
    },
  ) {
    return this.aiService.requestGeneration({ ...body, userId });
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'AI 생성 작업 상태 조회' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.aiService.getJobStatus(jobId);
  }
}
