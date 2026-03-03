---
name: cms-nestjs-module
description: NestJS 모듈, 컨트롤러, 서비스, DTO 생성을 지원합니다. 백엔드 모듈 개발, NestJS 구조 생성에 사용합니다. module, controller, service, dto, NestJS 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CMS-UI NestJS 모듈 생성 Skill

## 개요
NestJS 백엔드 모듈 생성을 위한 템플릿과 가이드입니다.

## 모듈 구조
```
backend/src/module-name/
├── module-name.module.ts       # 모듈 정의
├── module-name.controller.ts   # REST API 컨트롤러
├── module-name.controller.spec.ts
├── module-name.service.ts      # 비즈니스 로직
├── module-name.service.spec.ts
├── dto/
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   └── module-name-response.dto.ts
├── entities/
│   └── module-name.entity.ts   # (TypeORM 사용 시)
└── interfaces/
    └── module-name.interface.ts
```

## 모듈 템플릿

### 1. Module 파일
```typescript
// module-name.module.ts
import { Module } from '@nestjs/common';
import { ModuleNameController } from './module-name.controller';
import { ModuleNameService } from './module-name.service';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
  ],
  controllers: [ModuleNameController],
  providers: [ModuleNameService],
  exports: [ModuleNameService],
})
export class ModuleNameModule {}
```

### 2. Controller 파일
```typescript
// module-name.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ModuleNameService } from './module-name.service';
import { CreateModuleNameDto } from './dto/create-module-name.dto';
import { UpdateModuleNameDto } from './dto/update-module-name.dto';
import { ModuleNameResponseDto } from './dto/module-name-response.dto';

@ApiTags('module-name')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('module-name')
export class ModuleNameController {
  constructor(private readonly moduleNameService: ModuleNameService) {}

  /**
   * 목록 조회
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  @Get()
  @ApiOperation({ summary: '목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: [ModuleNameResponseDto] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ModuleNameResponseDto[]> {
    return this.moduleNameService.findAll(page, limit);
  }

  /**
   * 단일 항목 조회
   * @param id 항목 ID
   */
  @Get(':id')
  @ApiOperation({ summary: '단일 항목 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: ModuleNameResponseDto })
  async findOne(@Param('id') id: number): Promise<ModuleNameResponseDto> {
    return this.moduleNameService.findOne(id);
  }

  /**
   * 새 항목 생성
   * @param createDto 생성 데이터
   */
  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '새 항목 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ModuleNameResponseDto })
  async create(
    @Body() createDto: CreateModuleNameDto,
  ): Promise<ModuleNameResponseDto> {
    return this.moduleNameService.create(createDto);
  }

  /**
   * 항목 수정
   * @param id 항목 ID
   * @param updateDto 수정 데이터
   */
  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '항목 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: ModuleNameResponseDto })
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateModuleNameDto,
  ): Promise<ModuleNameResponseDto> {
    return this.moduleNameService.update(id, updateDto);
  }

  /**
   * 항목 삭제
   * @param id 항목 ID
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '항목 삭제' })
  @ApiResponse({ status: HttpStatus.OK })
  async remove(@Param('id') id: number): Promise<void> {
    return this.moduleNameService.remove(id);
  }
}
```

### 3. Service 파일
```typescript
// module-name.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MysqlProvider } from '../database/mysql.provider';
import { LoggerService } from '../logger/logger.service';
import { CreateModuleNameDto } from './dto/create-module-name.dto';
import { UpdateModuleNameDto } from './dto/update-module-name.dto';
import { ModuleNameResponseDto } from './dto/module-name-response.dto';

@Injectable()
export class ModuleNameService {
  constructor(
    private readonly mysql: MysqlProvider,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 목록 조회
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   */
  async findAll(page: number, limit: number): Promise<ModuleNameResponseDto[]> {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM module_name
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    // 완성된 쿼리 로깅 (필수)
    this.logger.log(`[ModuleName] Query: SELECT * FROM module_name WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);

    const results = await this.mysql.query(query, [limit, offset]);
    return results.map(row => this.toResponseDto(row));
  }

  /**
   * 단일 항목 조회
   * @param id 항목 ID
   */
  async findOne(id: number): Promise<ModuleNameResponseDto> {
    const query = `SELECT * FROM module_name WHERE id = ? AND deleted_at IS NULL`;

    this.logger.log(`[ModuleName] Query: SELECT * FROM module_name WHERE id = ${id} AND deleted_at IS NULL`);

    const [result] = await this.mysql.query(query, [id]);

    if (!result) {
      throw new NotFoundException(`ID ${id}에 해당하는 항목을 찾을 수 없습니다.`);
    }

    return this.toResponseDto(result);
  }

  /**
   * 새 항목 생성
   * @param createDto 생성 데이터
   */
  async create(createDto: CreateModuleNameDto): Promise<ModuleNameResponseDto> {
    const query = `
      INSERT INTO module_name (name, description, created_at)
      VALUES (?, ?, NOW())
    `;

    this.logger.log(`[ModuleName] Query: INSERT INTO module_name (name, description, created_at) VALUES ('${createDto.name}', '${createDto.description}', NOW())`);

    const result = await this.mysql.query(query, [
      createDto.name,
      createDto.description,
    ]);

    return this.findOne(result.insertId);
  }

  /**
   * 항목 수정
   * @param id 항목 ID
   * @param updateDto 수정 데이터
   */
  async update(id: number, updateDto: UpdateModuleNameDto): Promise<ModuleNameResponseDto> {
    // 존재 여부 확인
    await this.findOne(id);

    const fields: string[] = [];
    const values: any[] = [];

    if (updateDto.name !== undefined) {
      fields.push('name = ?');
      values.push(updateDto.name);
    }
    if (updateDto.description !== undefined) {
      fields.push('description = ?');
      values.push(updateDto.description);
    }

    if (fields.length === 0) {
      throw new BadRequestException('수정할 필드가 없습니다.');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE module_name SET ${fields.join(', ')} WHERE id = ?`;

    // 완성된 쿼리 로깅
    const logQuery = query.replace(/\?/g, () => {
      const val = values.shift();
      values.push(val);
      return typeof val === 'string' ? `'${val}'` : String(val);
    });
    this.logger.log(`[ModuleName] Query: ${logQuery}`);

    await this.mysql.query(query, values);

    return this.findOne(id);
  }

  /**
   * 항목 삭제 (Soft Delete)
   * @param id 항목 ID
   */
  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const query = `UPDATE module_name SET deleted_at = NOW() WHERE id = ?`;

    this.logger.log(`[ModuleName] Query: UPDATE module_name SET deleted_at = NOW() WHERE id = ${id}`);

    await this.mysql.query(query, [id]);
  }

  /**
   * DB 결과를 Response DTO로 변환
   */
  private toResponseDto(row: any): ModuleNameResponseDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

### 4. DTO 파일들
```typescript
// dto/create-module-name.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateModuleNameDto {
  @ApiProperty({ description: '이름', example: '샘플 이름' })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  @MaxLength(100, { message: '이름은 100자 이하여야 합니다.' })
  name: string;

  @ApiProperty({ description: '설명', example: '샘플 설명', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '설명은 500자 이하여야 합니다.' })
  description?: string;
}
```

```typescript
// dto/update-module-name.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateModuleNameDto } from './create-module-name.dto';

export class UpdateModuleNameDto extends PartialType(CreateModuleNameDto) {}
```

```typescript
// dto/module-name-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ModuleNameResponseDto {
  @ApiProperty({ description: 'ID' })
  id: number;

  @ApiProperty({ description: '이름' })
  name: string;

  @ApiProperty({ description: '설명' })
  description: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}
```

## 체크리스트

### 모듈 생성 시
- [ ] Module 파일 생성
- [ ] Controller 파일 생성
- [ ] Service 파일 생성
- [ ] DTO 파일들 생성 (Create, Update, Response)
- [ ] 테스트 파일 생성
- [ ] app.module.ts에 모듈 등록
- [ ] Swagger 문서화 추가
- [ ] 권한 설정 (@Roles)
- [ ] 로깅 추가 (완성된 쿼리)

## 명령어
```bash
# NestJS CLI로 모듈 생성 (기본 구조)
nest g module module-name
nest g controller module-name
nest g service module-name
```
