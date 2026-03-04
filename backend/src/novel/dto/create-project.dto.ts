import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class MainCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

class WritingStyleDto {
  @IsOptional()
  @IsIn(['formal', 'colloquial', 'lyrical', 'humorous'])
  tone?: string;

  @IsOptional()
  @IsIn(['first_person', 'third_person_limited', 'third_person_omniscient'])
  perspective?: string;
}

class ProjectSettingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MainCharacterDto)
  mainCharacters?: MainCharacterDto[];

  @IsOptional()
  @IsString()
  worldBuilding?: string;
}

export class CreateProjectDto {
  @ApiProperty({ description: '프로젝트 제목', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: '장르',
    enum: ['ROMANCE', 'FANTASY', 'MARTIAL_ARTS', 'MODERN', 'MYSTERY', 'SF'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ROMANCE', 'FANTASY', 'MARTIAL_ARTS', 'MODERN', 'MYSTERY', 'SF'])
  genre: string;

  @ApiPropertyOptional({ description: '서브 장르' })
  @IsOptional()
  @IsString()
  subGenre?: string;

  @ApiProperty({ description: '시놉시스', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  synopsis: string;

  @ApiPropertyOptional({ description: '대상 독자층' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ description: '문체 설정' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WritingStyleDto)
  writingStyle?: WritingStyleDto;

  @ApiPropertyOptional({ description: '프로젝트 설정 (캐릭터, 세계관)' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
