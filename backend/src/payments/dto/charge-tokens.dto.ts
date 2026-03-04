import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChargeTokensDto {
  @ApiProperty({ description: '패키지 ID', example: '10000', enum: ['10000', '50000', '100000'] })
  @IsString()
  @IsIn(['10000', '50000', '100000'])
  packageId: string;

  @ApiProperty({ description: '멱등성 키' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}