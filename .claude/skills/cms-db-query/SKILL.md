---
name: cms-db-query
description: MySQL/MongoDB 쿼리 작성과 최적화를 지원합니다. 데이터베이스 쿼리 로깅, 성능 최적화, 트랜잭션 처리에 사용합니다. query, MySQL, MongoDB, database, 쿼리, DB 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# CMS-UI 데이터베이스 쿼리 Skill

## 개요
MySQL과 MongoDB 쿼리 작성, 최적화, 로깅을 위한 가이드입니다.

## 핵심 규칙

### ⚠️ 필수: 쿼리 로깅
**모든 쿼리문은 파라미터가 적용된 완성된 형태로 Logger에 기록해야 합니다.**

```typescript
// ❌ 잘못된 예
this.logger.log(`Query: SELECT * FROM users WHERE id = ?`);

// ✅ 올바른 예
this.logger.log(`Query: SELECT * FROM users WHERE id = ${id}`);
```

## MySQL 쿼리 패턴

### 1. SELECT 쿼리
```typescript
// 단일 조회
async findOne(id: number): Promise<User> {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ? AND deleted_at IS NULL
  `;

  // 완성된 쿼리 로깅
  this.logger.log(`[Users] SELECT id, name, email, created_at FROM users WHERE id = ${id} AND deleted_at IS NULL`);

  const [result] = await this.mysql.query(query, [id]);
  return result;
}

// 목록 조회 (페이지네이션)
async findAll(page: number, limit: number, search?: string): Promise<User[]> {
  const offset = (page - 1) * limit;
  let query = `
    SELECT id, name, email, created_at
    FROM users
    WHERE deleted_at IS NULL
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // 완성된 쿼리 로깅
  const logQuery = search
    ? `SELECT ... WHERE deleted_at IS NULL AND (name LIKE '%${search}%' OR email LIKE '%${search}%') ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : `SELECT ... WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  this.logger.log(`[Users] ${logQuery}`);

  return await this.mysql.query(query, params);
}
```

### 2. INSERT 쿼리
```typescript
async create(dto: CreateUserDto): Promise<number> {
  const query = `
    INSERT INTO users (name, email, password_hash, created_at)
    VALUES (?, ?, ?, NOW())
  `;

  // 완성된 쿼리 로깅 (민감 정보 제외)
  this.logger.log(`[Users] INSERT INTO users (name, email, password_hash, created_at) VALUES ('${dto.name}', '${dto.email}', '[HIDDEN]', NOW())`);

  const result = await this.mysql.query(query, [
    dto.name,
    dto.email,
    await bcrypt.hash(dto.password, 10),
  ]);

  return result.insertId;
}
```

### 3. UPDATE 쿼리 (동적 필드)
```typescript
async update(id: number, dto: UpdateUserDto): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  const logParts: string[] = [];

  if (dto.name !== undefined) {
    fields.push('name = ?');
    values.push(dto.name);
    logParts.push(`name = '${dto.name}'`);
  }

  if (dto.email !== undefined) {
    fields.push('email = ?');
    values.push(dto.email);
    logParts.push(`email = '${dto.email}'`);
  }

  if (fields.length === 0) {
    throw new BadRequestException('수정할 필드가 없습니다.');
  }

  fields.push('updated_at = NOW()');
  logParts.push('updated_at = NOW()');
  values.push(id);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

  // 완성된 쿼리 로깅
  this.logger.log(`[Users] UPDATE users SET ${logParts.join(', ')} WHERE id = ${id}`);

  await this.mysql.query(query, values);
}
```

### 4. DELETE 쿼리 (Soft Delete)
```typescript
async remove(id: number): Promise<void> {
  const query = `UPDATE users SET deleted_at = NOW() WHERE id = ?`;

  this.logger.log(`[Users] UPDATE users SET deleted_at = NOW() WHERE id = ${id}`);

  await this.mysql.query(query, [id]);
}
```

### 5. 트랜잭션 처리
```typescript
async transferCredits(fromId: number, toId: number, amount: number): Promise<void> {
  const connection = await this.mysql.getConnection();

  try {
    await connection.beginTransaction();
    this.logger.log(`[Credits] BEGIN TRANSACTION`);

    // 출금
    const deductQuery = `UPDATE accounts SET balance = balance - ? WHERE user_id = ? AND balance >= ?`;
    this.logger.log(`[Credits] UPDATE accounts SET balance = balance - ${amount} WHERE user_id = ${fromId} AND balance >= ${amount}`);
    const [deductResult] = await connection.query(deductQuery, [amount, fromId, amount]);

    if (deductResult.affectedRows === 0) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    // 입금
    const addQuery = `UPDATE accounts SET balance = balance + ? WHERE user_id = ?`;
    this.logger.log(`[Credits] UPDATE accounts SET balance = balance + ${amount} WHERE user_id = ${toId}`);
    await connection.query(addQuery, [amount, toId]);

    await connection.commit();
    this.logger.log(`[Credits] COMMIT`);

  } catch (error) {
    await connection.rollback();
    this.logger.error(`[Credits] ROLLBACK - ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}
```

## MongoDB 쿼리 패턴

### 1. Find 쿼리
```typescript
// 단일 조회
async findOne(id: string): Promise<Product> {
  this.logger.log(`[Products] db.products.findOne({ _id: ObjectId('${id}'), deletedAt: null })`);

  return await this.productModel.findOne({
    _id: id,
    deletedAt: null,
  }).exec();
}

// 목록 조회
async findAll(filter: ProductFilter): Promise<Product[]> {
  const query: any = { deletedAt: null };

  if (filter.category) {
    query.category = filter.category;
  }

  if (filter.minPrice || filter.maxPrice) {
    query.price = {};
    if (filter.minPrice) query.price.$gte = filter.minPrice;
    if (filter.maxPrice) query.price.$lte = filter.maxPrice;
  }

  this.logger.log(`[Products] db.products.find(${JSON.stringify(query)}).sort({ createdAt: -1 }).limit(${filter.limit}).skip(${filter.skip})`);

  return await this.productModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(filter.limit)
    .skip(filter.skip)
    .exec();
}
```

### 2. Aggregation Pipeline
```typescript
async getStatsByCategory(): Promise<CategoryStats[]> {
  const pipeline = [
    { $match: { deletedAt: null } },
    { $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        totalRevenue: { $sum: '$price' }
      }
    },
    { $sort: { count: -1 } }
  ];

  this.logger.log(`[Products] db.products.aggregate(${JSON.stringify(pipeline)})`);

  return await this.productModel.aggregate(pipeline).exec();
}
```

### 3. Update 쿼리
```typescript
async update(id: string, dto: UpdateProductDto): Promise<Product> {
  const updateData = {
    ...dto,
    updatedAt: new Date(),
  };

  this.logger.log(`[Products] db.products.findOneAndUpdate({ _id: ObjectId('${id}') }, { $set: ${JSON.stringify(updateData)} }, { new: true })`);

  return await this.productModel.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { new: true }
  ).exec();
}
```

## 쿼리 최적화 가이드

### 인덱스 활용
```sql
-- 자주 검색되는 컬럼에 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- 복합 인덱스 (조회 패턴에 맞게)
CREATE INDEX idx_users_org_status ON users(organization_id, status);
```

### N+1 문제 방지
```typescript
// ❌ N+1 문제
const users = await this.findAll();
for (const user of users) {
  user.roles = await this.roleService.findByUserId(user.id); // N번 쿼리
}

// ✅ JOIN 또는 IN 사용
const query = `
  SELECT u.*, r.name as role_name
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE u.deleted_at IS NULL
`;
```

### 페이지네이션 최적화
```typescript
// 큰 테이블의 경우 OFFSET 대신 커서 기반 페이지네이션
const query = `
  SELECT * FROM logs
  WHERE id < ?
  ORDER BY id DESC
  LIMIT ?
`;
this.logger.log(`[Logs] SELECT * FROM logs WHERE id < ${lastId} ORDER BY id DESC LIMIT ${limit}`);
```

## 보안 주의사항

1. **SQL Injection 방지**: 항상 파라미터 바인딩 사용
2. **민감 정보 로깅 금지**: 비밀번호, 토큰 등은 `[HIDDEN]`으로 마스킹
3. **권한 검증**: 쿼리 실행 전 사용자 권한 확인
4. **입력값 검증**: DTO에서 class-validator로 검증

## 체크리스트

- [ ] 파라미터 바인딩 사용 (SQL Injection 방지)
- [ ] 완성된 쿼리 Logger에 기록
- [ ] 민감 정보 마스킹
- [ ] 인덱스 활용 확인
- [ ] N+1 문제 확인
- [ ] 트랜잭션 필요성 검토
- [ ] 에러 핸들링 구현
