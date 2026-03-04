import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateChapterDto {
  @ApiProperty({ description: '챕터 번호', minimum: 1 })
  @IsNumber()
  @Min(1)
  chapterNumber: number;

  @ApiPropertyOptional({ description: '사용자 가이던스 (이번 챕터에서 원하는 전개)' })
  @IsOptional()
  @IsString()
  userGuidance?: string;
}
