---
name: cms-api-endpoint
description: REST API 엔드포인트 설계와 구현을 지원합니다. API 문서화, DTO 검증, 에러 핸들링에 사용합니다. API, endpoint, REST, 엔드포인트, route 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# CMS-UI REST API 엔드포인트 Skill

## 개요
NestJS 기반 REST API 엔드포인트 설계와 구현 가이드입니다.

## API 설계 규칙

### URL 네이밍 컨벤션
```
GET    /api/resources          # 목록 조회
GET    /api/resources/:id      # 단일 조회
POST   /api/resources          # 생성
PUT    /api/resources/:id      # 전체 수정
PATCH  /api/resources/:id      # 부분 수정
DELETE /api/resources/:id      # 삭제
```

### 복수형 리소스명 사용
```
O /api/users
O /api/products
O /api/organizations

X /api/user
X /api/product
```

### 계층적 리소스
```
GET  /api/organizations/:orgId/users           # 조직별 사용자 목록
GET  /api/organizations/:orgId/users/:userId   # 특정 조직의 특정 사용자
POST /api/organizations/:orgId/devices         # 조직에 기기 추가
```

## 컨트롤러 구현 패턴

### 기본 CRUD 컨트롤러
```typescript
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
  HttpCode,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import {
  RequireReadPermission,
  RequireCreatePermission,
  RequireUpdatePermission,
  RequireDeletePermission,
} from '../permissions/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  /**
   * 리소스 목록 조회
   */
  @Get()
  @RequireReadPermission('/resources')
  @ApiOperation({
    summary: '리소스 목록 조회',
    description: '페이지네이션과 검색을 지원하는 리소스 목록을 반환합니다.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공',
    type: PaginatedResponseDto
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: PaginationDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<ResourceResponseDto>> {
    return this.resourceService.findAll(query, user.organizationId);
  }

  /**
   * 리소스 단일 조회
   */
  @Get(':id')
  @RequireReadPermission('/resources')
  @ApiOperation({ summary: '리소스 단일 조회' })
  @ApiParam({ name: 'id', type: Number, description: '리소스 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '성공',
    type: ResourceResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '리소스를 찾을 수 없음' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.findOne(id);
  }

  /**
   * 리소스 생성
   */
  @Post()
  @RequireCreatePermission('/resources')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '리소스 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '생성 성공',
    type: ResourceResponseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateResourceDto,
    @CurrentUser() user: User,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.create(dto, user);
  }

  /**
   * 리소스 수정
   */
  @Put(':id')
  @RequireUpdatePermission('/resources')
  @ApiOperation({ summary: '리소스 수정' })
  @ApiParam({ name: 'id', type: Number, description: '리소스 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '수정 성공',
    type: ResourceResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '리소스를 찾을 수 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourceService.update(id, dto);
  }

  /**
   * 리소스 삭제
   */
  @Delete(':id')
  @RequireDeletePermission('/resources')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '리소스 삭제' })
  @ApiParam({ name: 'id', type: Number, description: '리소스 ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '삭제 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '리소스를 찾을 수 없음' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.resourceService.remove(id);
  }
}
```

## DTO 검증 패턴

### Create DTO
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEmail,
  IsEnum,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export class CreateResourceDto {
  @ApiProperty({
    description: '리소스 이름',
    example: '샘플 리소스',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(100, { message: '이름은 최대 100자까지 가능합니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: '설명',
    example: '리소스에 대한 설명입니다.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: '상태',
    enum: ResourceStatus,
    example: ResourceStatus.ACTIVE,
  })
  @IsEnum(ResourceStatus, { message: '올바른 상태값을 입력하세요.' })
  status: ResourceStatus;

  @ApiProperty({
    description: '가격',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: '태그 목록',
    type: [String],
    example: ['태그1', '태그2'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: '태그는 최대 10개까지 가능합니다.' })
  tags?: string[];
}
```

### Pagination DTO
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

### Response DTO
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ResourceResponseDto {
  @ApiProperty({ description: 'ID', example: 1 })
  id: number;

  @ApiProperty({ description: '이름', example: '샘플 리소스' })
  name: string;

  @ApiProperty({ description: '설명', example: '설명' })
  description: string;

  @ApiProperty({ description: '상태', example: 'active' })
  status: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  data: T[];

  @ApiProperty({ description: '전체 개수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 개수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 10 })
  totalPages: number;
}
```

## 에러 응답 표준화

### HTTP 상태 코드 사용
```typescript
// 성공
200 OK              // 조회, 수정 성공
201 Created         // 생성 성공
204 No Content      // 삭제 성공

// 클라이언트 에러
400 Bad Request     // 잘못된 요청 (검증 실패)
401 Unauthorized    // 인증 필요
403 Forbidden       // 권한 없음
404 Not Found       // 리소스 없음
409 Conflict        // 충돌 (중복 등)

// 서버 에러
500 Internal Server Error  // 서버 에러
```

### 에러 응답 형식
```typescript
// common/exceptions/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다.';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorCode = (exceptionResponse as any).errorCode || errorCode;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 권한 체크 패턴

### Permission 기반 접근 제어
```typescript
// 데코레이터 정의
// permissions/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const RequireReadPermission = (path: string) => SetMetadata(PERMISSION_KEY, { path, action: 'read' });
export const RequireCreatePermission = (path: string) => SetMetadata(PERMISSION_KEY, { path, action: 'create' });
export const RequireUpdatePermission = (path: string) => SetMetadata(PERMISSION_KEY, { path, action: 'update' });
export const RequireDeletePermission = (path: string) => SetMetadata(PERMISSION_KEY, { path, action: 'delete' });

// 사용
@Get()
@RequireReadPermission('/devices/tags')
async findAll() { }

@Post()
@RequireCreatePermission('/devices/tags')
async create() { }

@Put(':id')
@RequireUpdatePermission('/devices/tags')
async update() { }

@Delete(':id')
@RequireDeletePermission('/devices/tags')
async remove() { }
```

## Swagger 문서화

### 전역 설정
```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('CMS API')
  .setDescription('CMS REST API 문서')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('users', '사용자 관리')
  .addTag('devices', '기기 관리')
  .addTag('products', '상품 관리')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

## 체크리스트

### API 엔드포인트 생성 시
- [ ] RESTful URL 규칙 준수
- [ ] 적절한 HTTP 메서드 사용
- [ ] DTO 검증 적용
- [ ] Swagger 문서화
- [ ] 권한 체크 (PermissionsGuard)
- [ ] 에러 핸들링
- [ ] 응답 DTO 정의
- [ ] 테스트 코드 작성
