import { IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    description: '평점 (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}
