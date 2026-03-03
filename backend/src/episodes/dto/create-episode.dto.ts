import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEpisodeDto {
  @ApiPropertyOptional({
    description: '삽입할 위치 (미지정 시 끝에 추가)',
    minimum: 1,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @ApiProperty({ description: '회차 제목', example: '제1화: 시작', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '회차 본문 내용', example: '어느 날 갑자기...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '무료 회차 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ description: '회차 가격 (토큰)', default: 0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: '작가의 말', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  authorNote?: string;

  @ApiPropertyOptional({ description: '즉시 발행 여부', default: false })
  @IsOptional()
  @IsBoolean()
  publishNow?: boolean;
}
