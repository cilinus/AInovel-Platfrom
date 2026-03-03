import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkDto {
  @ApiProperty({ description: '작품 제목', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: '작품 시놉시스', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: '장르',
    enum: ['ROMANCE', 'FANTASY', 'MARTIAL_ARTS', 'MODERN', 'MYSTERY', 'SF'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ROMANCE', 'FANTASY', 'MARTIAL_ARTS', 'MODERN', 'MYSTERY', 'SF'])
  genre: string;

  @ApiPropertyOptional({ description: '태그 목록' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '서브 장르 목록' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subGenres?: string[];

  @ApiPropertyOptional({ description: '에피소드당 토큰 가격', default: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenPrice?: number;

  @ApiPropertyOptional({ description: '무료 에피소드 수', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeEpisodeCount?: number;

  @ApiPropertyOptional({ description: 'AI 생성 여부' })
  @IsOptional()
  @IsBoolean()
  isAIGenerated?: boolean;
}
