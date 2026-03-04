import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { ClaudeService } from '../services/claude.service';
import { GENRE_PRESETS } from '../constants/genre-presets';
import { DEFAULT_CHAPTER_WORDS } from '../constants/ai-costs';
import { GenerationContext, StreamChunk } from '../types/novel.types';

@Injectable()
export class WriterAgent {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly logger: LoggerService,
  ) {}

  async *generate(context: GenerationContext): AsyncGenerator<StreamChunk> {
    this.logger.debug(
      `WriterAgent.generate - projectId: ${context.projectId}, chapter: ${context.chapterNumber}, genre: ${context.genre}`,
      'WriterAgent',
    );

    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(context);

    this.logger.debug(
      `WriterAgent.generate - systemPrompt length: ${systemPrompt.length}, userMessage length: ${userMessage.length}`,
      'WriterAgent',
    );

    yield* this.claudeService.streamMessage({
      system: systemPrompt,
      userMessage,
    });
  }

  private buildSystemPrompt(context: GenerationContext): string {
    const preset = GENRE_PRESETS[context.genre];
    const basePrompt = preset?.systemPrompt ?? '당신은 한국 웹소설 전문 작가입니다.';
    const styleGuidance = preset?.styleGuidance ?? '';

    const parts: string[] = [
      basePrompt,
      '',
      '## 작성 규칙',
      `- 약 ${DEFAULT_CHAPTER_WORDS}자 분량의 챕터를 작성합니다.`,
      '- 한국어로 작성합니다.',
      '- 웹소설 특유의 짧은 문장과 문단을 사용합니다.',
      '- 대화와 묘사의 균형을 맞춥니다.',
      '- 챕터 끝에 다음 화에 대한 궁금증을 유발합니다.',
      '- 제목은 첫 줄에 "# 제목" 형식으로 작성합니다.',
    ];

    if (styleGuidance) {
      parts.push('', `## 스타일 가이드`, styleGuidance);
    }

    const { writingStyle } = context;
    if (writingStyle) {
      const toneMap: Record<string, string> = {
        formal: '격식체',
        colloquial: '구어체',
        lyrical: '서정적',
        humorous: '유머러스',
      };
      const perspectiveMap: Record<string, string> = {
        first_person: '1인칭',
        third_person_limited: '3인칭 제한',
        third_person_omniscient: '3인칭 전지',
      };
      parts.push(
        '',
        '## 문체',
        `- 어조: ${toneMap[writingStyle.tone] ?? writingStyle.tone}`,
        `- 시점: ${perspectiveMap[writingStyle.perspective] ?? writingStyle.perspective}`,
      );
    }

    if (context.settings?.mainCharacters?.length) {
      parts.push('', '## 주요 등장인물');
      for (const char of context.settings.mainCharacters) {
        parts.push(`- **${char.name}**: ${char.description}`);
      }
    }

    if (context.settings?.worldBuilding) {
      parts.push('', '## 세계관 설정', context.settings.worldBuilding);
    }

    return parts.join('\n');
  }

  private buildUserMessage(context: GenerationContext): string {
    const parts: string[] = [
      `## 작품 정보`,
      `- 장르: ${context.genre}${context.subGenre ? ` / ${context.subGenre}` : ''}`,
      `- 시놉시스: ${context.synopsis}`,
      '',
      `## 요청`,
      `${context.chapterNumber}화를 작성해 주세요.`,
    ];

    if (context.previousChapters?.length) {
      parts.push('', '## 이전 챕터 요약');
      for (const prev of context.previousChapters) {
        parts.push(`- ${prev.chapterNumber}화: ${prev.summary}`);
      }
    }

    if (context.chapterOutline) {
      parts.push(
        '',
        '## 이번 챕터 목표',
        `- 목표: ${context.chapterOutline.goal}`,
        `- 핵심 사건: ${context.chapterOutline.keyEvents}`,
      );
      if (context.chapterOutline.notes) {
        parts.push(`- 참고: ${context.chapterOutline.notes}`);
      }
    }

    if (context.userGuidance) {
      parts.push('', '## 작가의 가이던스', context.userGuidance);
    }

    return parts.join('\n');
  }
}
