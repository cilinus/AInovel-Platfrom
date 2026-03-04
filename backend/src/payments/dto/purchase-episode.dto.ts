import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseEpisodeDto {
  @ApiProperty({ description: '에피소드 ID' })
  @IsString()
  @IsNotEmpty()
  episodeId: string;
}