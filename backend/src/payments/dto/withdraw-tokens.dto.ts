import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawTokensDto {
  @ApiProperty({ description: '출금할 토큰 수', minimum: 1000 })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ description: '멱등성 키' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}