import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LoggerService } from '../../logger/logger.service';
import { StreamChunk } from '../types/novel.types';
import { CLAUDE_MODEL, CLAUDE_MAX_TOKENS, RETRY_CONFIG } from '../constants/ai-costs';

export interface ClaudeMessageParams {
  system: string;
  userMessage: string;
  maxTokens?: number;
}

@Injectable()
export class ClaudeService {
  private client: Anthropic | null = null;
  private readonly mockMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.mockMode = this.configService.get<string>('AI_MOCK_MODE', 'false') === 'true';

    if (!this.mockMode) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (apiKey) {
        this.client = new Anthropic({ apiKey });
        this.logger.log('ClaudeService initialized with API key', 'ClaudeService');
      } else {
        this.logger.warn('ANTHROPIC_API_KEY not set, falling back to mock mode', 'ClaudeService');
      }
    } else {
      this.logger.log('ClaudeService initialized in mock mode', 'ClaudeService');
    }
  }

  get isMockMode(): boolean {
    return this.mockMode || !this.client;
  }

  async sendMessage(params: ClaudeMessageParams): Promise<string> {
    const { system, userMessage, maxTokens = CLAUDE_MAX_TOKENS } = params;

    if (this.mockMode || !this.client) {
      this.logger.debug('sendMessage - using mock mode', 'ClaudeService');
      return '[Mock response]';
    }

    this.logger.debug(
      `sendMessage - model: ${CLAUDE_MODEL}, maxTokens: ${maxTokens}, systemLength: ${system.length}, userMessageLength: ${userMessage.length}`,
      'ClaudeService',
    );

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelayMs,
          );
          this.logger.warn(
            `sendMessage - retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms`,
            'ClaudeService',
          );
          await this.sleep(delay);
        }

        const response = await this.client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: userMessage }],
        });

        const textContent = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('');

        this.logger.debug(
          `sendMessage - success: inputTokens=${response.usage.input_tokens}, outputTokens=${response.usage.output_tokens}`,
          'ClaudeService',
        );

        return textContent;
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        this.logger.error(
          `sendMessage - error on attempt ${attempt}: ${lastError.message}, retryable: ${isRetryable}`,
          lastError.stack,
          'ClaudeService',
        );

        if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  async *streamMessage(params: ClaudeMessageParams): AsyncGenerator<StreamChunk> {
    const { system, userMessage, maxTokens = CLAUDE_MAX_TOKENS } = params;

    if (this.mockMode || !this.client) {
      this.logger.debug('streamMessage - using mock mode', 'ClaudeService');
      yield* this.mockStream();
      return;
    }

    this.logger.debug(
      `streamMessage - model: ${CLAUDE_MODEL}, maxTokens: ${maxTokens}, systemLength: ${system.length}, userMessageLength: ${userMessage.length}`,
      'ClaudeService',
    );

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelayMs,
          );
          this.logger.warn(
            `streamMessage - retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms`,
            'ClaudeService',
          );
          await this.sleep(delay);
        }

        const stream = this.client.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: userMessage }],
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { type: 'text_delta', text: event.delta.text };
          }
        }

        const finalMessage = await stream.finalMessage();
        yield {
          type: 'message_complete',
          usage: {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
          },
        };

        return;
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        this.logger.error(
          `streamMessage - error on attempt ${attempt}: ${lastError.message}, retryable: ${isRetryable}`,
          lastError.stack,
          'ClaudeService',
        );

        if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Anthropic.RateLimitError) return true;
    if (error instanceof Anthropic.InternalServerError) return true;
    if (error instanceof Anthropic.APIConnectionError) return true;
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async *mockStream(): AsyncGenerator<StreamChunk> {
    const mockParagraphs = [
      '어둠이 내려앉은 거리를 걸으며, 그는 오래전 잊었던 기억의 조각들을 떠올렸다.',
      '바람이 불어올 때마다 낡은 간판이 삐걱거리는 소리가 들렸다. 이 거리는 십 년 전과 달라진 것이 없었다.',
      '\n\n"여기서 뭘 하는 거야?"',
      '\n\n뒤에서 들려온 목소리에 그는 천천히 뒤를 돌아보았다. 거기에는 이미 사라졌다고 생각했던 사람이 서 있었다.',
      '\n\n"오랜만이네." 그는 애써 평온한 표정을 지으며 말했다.',
      '\n\n그녀는 한동안 그를 바라보다가 작게 웃었다. 그 미소 속에는 말로 다 할 수 없는 세월의 무게가 담겨 있었다.',
      '\n\n"들어와. 이야기할 것이 있어."',
      '\n\n그녀가 낡은 카페의 문을 열었다. 안에서는 따뜻한 커피 향이 새어 나왔다. 그는 잠시 망설이다가 그녀를 따라 안으로 들어갔다.',
      '\n\n카페 안은 예상외로 아늑했다. 벽에는 옛 사진들이 걸려 있었고, 한 구석에서는 재즈 음악이 조용히 흘러나왔다.',
      '\n\n그들은 창가 자리에 마주 앉았다. 오랜 침묵이 흘렀다. 먼저 입을 연 것은 그녀였다.',
    ];

    for (const paragraph of mockParagraphs) {
      const words = paragraph.split('');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join('');
        yield { type: 'text_delta', text: chunk };
        await this.sleep(20);
      }
    }

    yield {
      type: 'message_complete',
      usage: { input_tokens: 500, output_tokens: 800 },
    };
  }
}
