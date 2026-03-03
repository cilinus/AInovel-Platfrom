---
name: cms-module
description: NestJS 모듈 스캐폴딩 및 module, controller, service, dto, repository 생성을 지원합니다. 기존 프로젝트 패턴(Controller->Service->Repository->DTO->Spec)에 맞는 전체 모듈 구조를 생성한다. NestJS 모듈 개발, 백엔드 모듈 구조 생성 시 자동 활성화됩니다. 호출 시 모듈명을 인자로 전달한다.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CMS Module Scaffolding

NestJS 백엔드에 새 모듈을 생성할 때, 기존 프로젝트 패턴에 정확히 맞는 파일 구조를 생성하는 스킬.

**원칙:** 기존 패턴을 정확히 따른다. 새로운 패턴을 발명하지 않는다.

## 사용법

`/module [모듈명]` 형식으로 호출한다. 모듈명은 kebab-case로 전달한다.

예시: `/module product-category`

## 1. 생성 파일 구조

모듈명이 `[name]`일 때, `backend/src/[name]/` 디렉토리에 다음 파일을 생성한다:

```
backend/src/[name]/
  [name].module.ts
  [name].controller.ts
  [name].service.ts
  [name].repository.ts
  [name].service.spec.ts
backend/src/dto/
  [name].dto.ts
```

## 2. 파일별 템플릿

### Module (`[name].module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { [PascalName]Controller } from './[name].controller';
import { [PascalName]Service } from './[name].service';
import { [PascalName]Repository } from './[name].repository';
import { MysqlProvider } from '../database/mysql.provider';

@Module({
  controllers: [[PascalName]Controller],
  providers: [[PascalName]Service, [PascalName]Repository, MysqlProvider],
  exports: [[PascalName]Service],
})
export class [PascalName]Module {}
```

### Controller (`[name].controller.ts`)

> **참고:** Controller/API 엔드포인트의 상세 패턴(Swagger 문서화, 에러 응답, 페이지네이션, 권한 가드 등)은 `cms-api-endpoint` 스킬을 참조한다.

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import {
  RequireReadPermission,
  RequireCreatePermission,
  RequireUpdatePermission,
  RequireDeletePermission,
} from '../permissions/permissions.decorator';
import { [PascalName]Service } from './[name].service';
import { Create[PascalName]Dto, Update[PascalName]Dto } from '../dto/[name].dto';

@ApiTags('[PascalName]')
@Controller('[name]')  // kebab-case 복수형 사용 (예: product-categories)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class [PascalName]Controller {
  constructor(private readonly service: [PascalName]Service) {}

  @Post()
  @RequireCreatePermission('/[permission-path]')
  @ApiOperation({ summary: '[PascalName] 생성' })
  create(@Body() dto: Create[PascalName]Dto) {
    return this.service.create(dto);
  }

  @Get()
  @RequireReadPermission('/[permission-path]')
  @ApiOperation({ summary: '[PascalName] 목록 조회' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequireReadPermission('/[permission-path]')
  @ApiOperation({ summary: '[PascalName] 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id')
  @RequireUpdatePermission('/[permission-path]')
  @ApiOperation({ summary: '[PascalName] 수정' })
  update(@Param('id') id: string, @Body() dto: Update[PascalName]Dto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @RequireDeletePermission('/[permission-path]')
  @ApiOperation({ summary: '[PascalName] 삭제' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
```

### Service (`[name].service.ts`)

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { [PascalName]Repository } from './[name].repository';
import { Create[PascalName]Dto, Update[PascalName]Dto } from '../dto/[name].dto';

@Injectable()
export class [PascalName]Service {
  constructor(private readonly repository: [PascalName]Repository) {}

  async create(dto: Create[PascalName]Dto) {
    return this.repository.create(dto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: number) {
    const result = await this.repository.findOne(id);
    if (!result) {
      throw new NotFoundException(`ID ${id}에 해당하는 항목을 찾을 수 없습니다.`);
    }
    return result;
  }

  async update(id: number, dto: Update[PascalName]Dto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.repository.remove(id);
  }
}
```

### Repository (`[name].repository.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { MysqlProvider } from '../database/mysql.provider';
import { Create[PascalName]Dto, Update[PascalName]Dto } from '../dto/[name].dto';

@Injectable()
export class [PascalName]Repository {
  constructor(private readonly db: MysqlProvider) {}

  async create(dto: Create[PascalName]Dto) {
    const query = 'INSERT INTO [table_name] (...) VALUES (...)';
    const params = [/* dto fields */];
    return this.db.executeQuery(query, params);
  }

  async findAll() {
    const query = 'SELECT * FROM [table_name] ORDER BY id DESC';
    return this.db.executeQuery<any[]>(query);
  }

  async findOne(id: number) {
    const query = 'SELECT * FROM [table_name] WHERE id = ?';
    const results = await this.db.executeQuery<any[]>(query, [id]);
    return results && results.length > 0 ? results[0] : null;
  }

  async update(id: number, dto: Update[PascalName]Dto) {
    const fields: string[] = [];
    const params: any[] = [];

    // dto의 각 필드에 대해 동적으로 SET 절 구성
    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return;

    params.push(id);
    const query = `UPDATE [table_name] SET ${fields.join(', ')} WHERE id = ?`;
    return this.db.executeQuery(query, params);
  }

  async remove(id: number) {
    const query = 'DELETE FROM [table_name] WHERE id = ?';
    return this.db.executeQuery(query, [id]);
  }
}
```

### DTO (`backend/src/dto/[name].dto.ts`)

```typescript
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// --- Create DTO ---
export class Create[PascalName]Dto {
  @ApiProperty({ description: '이름', example: '샘플 이름', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(100, { message: '이름은 최대 100자까지 가능합니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ description: '설명', example: '샘플 설명' })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '설명은 500자 이하여야 합니다.' })
  description?: string;
}

// --- Update DTO (PartialType으로 Create 필드를 모두 optional로 변환) ---
export class Update[PascalName]Dto extends PartialType(Create[PascalName]Dto) {}

// --- Response DTO ---
export class [PascalName]ResponseDto {
  @ApiProperty({ description: 'ID', example: 1 })
  id: number;

  @ApiProperty({ description: '이름', example: '샘플 이름' })
  name: string;

  @ApiProperty({ description: '설명', example: '설명' })
  description: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}
```

**DTO 검증 데코레이터 참고 (필드 유형별):**

| 유형 | 데코레이터 |
|------|-----------|
| 필수 문자열 | `@IsString() @IsNotEmpty() @MaxLength(n)` |
| 선택 문자열 | `@IsString() @IsOptional() @MaxLength(n)` |
| 숫자 | `@IsNumber() @Min(n) @Max(n) @Type(() => Number)` |
| 열거형 | `@IsEnum(EnumType, { message: '...' })` |
| 배열 | `@IsArray() @IsString({ each: true }) @ArrayMaxSize(n)` |
| 불리언 | `@IsBoolean() @Type(() => Boolean)` |
| 공백 제거 | `@Transform(({ value }) => value?.trim())` |

### Test (`[name].service.spec.ts`)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { [PascalName]Service } from './[name].service';
import { [PascalName]Repository } from './[name].repository';
import { NotFoundException } from '@nestjs/common';

describe('[PascalName]Service', () => {
  let service: [PascalName]Service;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [PascalName]Service,
        { provide: [PascalName]Repository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<[PascalName]Service>([PascalName]Service);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return item when found', async () => {
      const mockItem = { id: 1, fieldName: 'test' };
      mockRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.findOne(1);
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return new item', async () => {
      const dto = { fieldName: 'test' };
      const mockResult = { insertId: 1 };
      mockRepository.create.mockResolvedValue(mockResult);

      const result = await service.create(dto as any);
      expect(result).toEqual(mockResult);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });
});
```

## 3. 생성 후 체크리스트

```
1. [파일 생성] -> verify: 6개 파일이 모두 존재
2. [모듈 등록] -> verify: app.module.ts에 import 추가
3. [테이블명] -> verify: repository의 [table_name]을 실제 테이블명으로 교체
4. [DTO 필드] -> verify: 실제 테이블 컬럼에 맞게 DTO 필드 정의
5. [권한 경로] -> verify: controller의 [permission-path]를 실제 경로로 교체
6. [테스트 실행] -> verify: npx jest [name].service.spec.ts 통과
7. [빌드 확인] -> verify: npm run build:backend 성공
```

## 4. 명명 규칙

| 입력 | 변환 | 예시 |
|------|------|------|
| 모듈명 | kebab-case | `product-category` |
| 클래스명 | PascalCase | `ProductCategory` |
| 파일명 | kebab-case | `product-category.service.ts` |
| 테이블명 | snake_case | `product_category` |
| 컨트롤러 경로 | kebab-case 복수형 | `product-categories` |
