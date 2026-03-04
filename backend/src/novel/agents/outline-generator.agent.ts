import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { ClaudeService } from '../services/claude.service';
import { PlotOutlineItem } from '../types/novel.types';

@Injectable()
export class OutlineGeneratorAgent {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly logger: LoggerService,
  ) {}

  async generate(
    synopsis: string,
    genre: string,
    totalChapters: number,
  ): Promise<PlotOutlineItem[]> {
    this.logger.debug(
      `OutlineGeneratorAgent.generate - genre: ${genre}, totalChapters: ${totalChapters}, synopsisLength: ${synopsis.length}`,
      'OutlineGeneratorAgent',
    );

    if (this.claudeService.isMockMode) {
      this.logger.debug('OutlineGeneratorAgent.generate - mock mode', 'OutlineGeneratorAgent');
      return this.buildMockOutline(totalChapters);
    }

    const system = '당신은 한국 웹소설 전문 기획자입니다. 시놉시스와 장르를 기반으로 챕터별 상세 플롯 아웃라인을 JSON 배열로 생성합니다.';

    const userMessage = [
      `장르: ${genre}`,
      `총 챕터 수: ${totalChapters}`,
      '',
      '## 시놉시스',
      synopsis,
      '',
      '## 요청',
      `위 시놉시스를 기반으로 ${totalChapters}개 챕터의 플롯 아웃라인을 생성해주세요.`,
      '각 챕터에는 chapterNumber, goal(챕터 목표), keyEvents(핵심 사건), notes(참고사항, 선택)를 포함합니다.',
      '',
      '## 출력 형식',
      'JSON 배열만 출력하세요. 다른 설명은 추가하지 마세요.',
      '```json',
      '[',
      '  { "chapterNumber": 1, "goal": "...", "keyEvents": "...", "notes": "..." },',
      '  ...',
      ']',
      '```',
    ].join('\n');

    try {
      const response = await this.claudeService.sendMessage({
        system,
        userMessage,
        maxTokens: 4096,
      });

      const outline = this.parseOutlineResponse(response, totalChapters);

      this.logger.log(
        `OutlineGeneratorAgent.generate - success: ${outline.length} chapters`,
        'OutlineGeneratorAgent',
      );

      return outline;
    } catch (error) {
      this.logger.error(
        `OutlineGeneratorAgent.generate - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'OutlineGeneratorAgent',
      );
      throw error;
    }
  }

  private parseOutlineResponse(response: string, totalChapters: number): PlotOutlineItem[] {
    // JSON 블록 추출 (```json ... ``` 또는 직접 배열)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      this.logger.error(
        'OutlineGeneratorAgent.parseOutlineResponse - JSON 배열을 찾을 수 없음',
        undefined,
        'OutlineGeneratorAgent',
      );
      throw new Error('AI 응답에서 아웃라인 JSON을 파싱할 수 없습니다');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PlotOutlineItem[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI 응답이 유효한 아웃라인 배열이 아닙니다');
    }

    // 각 항목에 필수 필드 확인
    return parsed.map((item, idx) => ({
      chapterNumber: item.chapterNumber ?? idx + 1,
      goal: item.goal ?? '',
      keyEvents: item.keyEvents ?? '',
      notes: item.notes,
    }));
  }

  private buildMockOutline(totalChapters: number): PlotOutlineItem[] {
    const mockGoals = [
      '주인공 소개와 일상 묘사, 세계관 설정',
      '사건 발생과 모험의 시작',
      '새로운 동료와의 만남, 첫 번째 시련',
    ];

    const mockEvents = [
      '평범한 일상에서 이상한 징조 발견, 핵심 갈등의 씨앗',
      '운명적 사건 발생, 주인공의 결심과 여정 시작',
      '동료 캐릭터 등장, 첫 전투/갈등, 성장의 계기',
    ];

    return Array.from({ length: totalChapters }, (_, i) => ({
      chapterNumber: i + 1,
      goal: mockGoals[i % mockGoals.length],
      keyEvents: mockEvents[i % mockEvents.length],
      notes: i === 0 ? '독자의 흥미를 끌 수 있는 강렬한 오프닝 필요' : undefined,
    }));
  }
}