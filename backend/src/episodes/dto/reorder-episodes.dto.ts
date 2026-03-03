import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EpisodeOrderItem {
  @ApiProperty({ description: '에피소드 ID' })
  @IsMongoId()
  @IsNotEmpty()
  episodeId: string;

  @ApiProperty({ description: '변경할 에피소드 번호', minimum: 1 })
  @IsInt()
  @Min(1)
  episodeNumber: number;
}

export class ReorderEpisodesDto {
  @ApiProperty({
    description: '에피소드 순서 목록',
    type: [EpisodeOrderItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeOrderItem)
  orders: EpisodeOrderItem[];
}
