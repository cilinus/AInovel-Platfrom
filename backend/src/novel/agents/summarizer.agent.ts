import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { ClaudeService } from '../services/claude.service';

@Injectable()
export class SummarizerAgent {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly logger: LoggerService,
  ) {}

  async summarize(content: string): Promise<string> {
    this.logger.debug(
      `SummarizerAgent.summarize - contentLength: ${content.length}`,
      'SummarizerAgent',
    );

    if (this.claudeService.isMockMode) {
      this.logger.debug('SummarizerAgent.summarize - mock mode', 'SummarizerAgent');
      return '주인공이 새로운 사건에 휘말리며 중요한 인물을 만나게 된다. 과거의 비밀이 조금씩 드러나기 시작하고, 예상치 못한 갈등이 발생한다. 다음 챕터에서의 전개를 암시하는 복선이 깔린다.';
    }

    const system = '당신은 한국 웹소설 전문 편집자입니다. 소설 챕터의 핵심 내용을 정확하고 간결하게 요약하는 역할을 합니다.';

    const userMessage = [
      '다음 소설 챕터의 내용을 200-300자의 한국어로 요약해주세요.',
      '주요 사건, 캐릭터 변화, 미해결 복선을 반드시 포함하세요.',
      '요약만 출력하고, 다른 설명은 추가하지 마세요.',
      '',
      '---',
      content,
    ].join('\n');

    try {
      const summary = await this.claudeService.sendMessage({
        system,
        userMessage,
        maxTokens: 1024,
      });

      this.logger.log(
        `SummarizerAgent.summarize - success: summaryLength=${summary.length}`,
        'SummarizerAgent',
      );

      return summary.trim();
    } catch (error) {
      this.logger.error(
        `SummarizerAgent.summarize - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'SummarizerAgent',
      );
      throw error;
    }
  }
}