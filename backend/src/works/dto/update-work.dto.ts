import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateWorkDto } from './create-work.dto';

export class UpdateWorkDto extends PartialType(CreateWorkDto) {
  @ApiPropertyOptional({
    description: '작품 상태',
    enum: ['DRAFT', 'ONGOING', 'COMPLETED', 'HIATUS'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ONGOING', 'COMPLETED', 'HIATUS'])
  status?: string;
}
