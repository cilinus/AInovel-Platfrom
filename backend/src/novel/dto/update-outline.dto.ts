import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PlotOutlineItemDto {
  @ApiProperty({ description: '챕터 번호' })
  @IsNumber()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({ description: '챕터 목표' })
  @IsString()
  goal: string;

  @ApiProperty({ description: '핵심 사건' })
  @IsString()
  keyEvents: string;

  @ApiPropertyOptional({ description: '참고사항' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOutlineDto {
  @ApiProperty({ description: '플롯 아웃라인 배열', type: [PlotOutlineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlotOutlineItemDto)
  plotOutline: PlotOutlineItemDto[];
}

export class GenerateOutlineDto {
  @ApiProperty({ description: '생성할 총 챕터 수', minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  totalChapters: number;
}