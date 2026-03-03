---
name: mongodb-connect
description: MongoDB 데이터베이스에 직접 연결하여 쿼리를 실행합니다. 컬렉션 조회, 문서 검색, 데이터 분석에 사용합니다. mongodb, mongo, 몽고, 컬렉션, document 관련 작업 시 활성화됩니다.
allowed-tools: Bash, Read, AskUserQuestion
user-invocable: true
---

# MongoDB Direct Connect Skill

## Overview

Backend의 `.env` 파일에서 MongoDB 접속 정보를 읽어 mongoose 라이브러리로 직접 쿼리를 실행합니다.

## Execution Flow

### Step 1: Read Connection Config

Read the backend `.env` file to extract MongoDB connection variables:

```
D:\Cil_WorkSpace\CMS-UI-feature-timezone\backend\.env
```

Required variable:
- `MONGODB_URI` - Full MongoDB connection URI

### Step 2: Determine Query

If the user provided a query as an argument, use it directly.
If no argument was provided, ask the user what they want to do:

**AskUserQuestion options:**
1. **컬렉션 목록** - 전체 컬렉션 목록 조회
2. **문서 조회** - 특정 컬렉션의 문서 조회
3. **Aggregation** - 집계 파이프라인 실행
4. **컬렉션 통계** - 컬렉션별 문서 수 및 크기 확인

### Step 3: Execute Query via Node Script

Use the project's existing `mongoose` package to run queries. Execute from the `backend` directory.

**Query execution template:**

```bash
cd /d/Cil_WorkSpace/CMS-UI-feature-timezone/backend && node -e "
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('MONGODB_URI_VALUE');
  const db = mongoose.connection.db;
  try {
    // QUERY HERE
    const result = await db.collection('COLLECTION').find({}).limit(20).toArray();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
  }
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
"
```

### Common Queries by Option

#### Option 1: 컬렉션 목록
```javascript
const collections = await db.listCollections().toArray();
console.log(JSON.stringify(collections.map(c => c.name), null, 2));
```

#### Option 2: 문서 조회
Ask user for collection name, then:
```javascript
const docs = await db.collection('NAME').find({}).limit(20).toArray();
console.log(JSON.stringify(docs, null, 2));
```

With filter:
```javascript
const docs = await db.collection('NAME').find(FILTER).limit(20).toArray();
console.log(JSON.stringify(docs, null, 2));
```

#### Option 3: Aggregation
Ask user for collection name and pipeline, then:
```javascript
const result = await db.collection('NAME').aggregate(PIPELINE).toArray();
console.log(JSON.stringify(result, null, 2));
```

#### Option 4: 컬렉션 통계
```javascript
const collections = await db.listCollections().toArray();
for (const col of collections) {
  const stats = await db.collection(col.name).estimatedDocumentCount();
  console.log(col.name + ': ' + stats + ' documents');
}
```

## Safety Rules

1. **READ-ONLY by default**: Only find, aggregate, countDocuments, listCollections, stats queries are allowed without confirmation
2. **Write operations require confirmation**: insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany, drop must prompt user with AskUserQuestion before executing
3. **Never log passwords**: When displaying connection info, mask the password in URI
4. **Timeout**: Set query timeout to 30 seconds
5. **Result limit**: For find queries without limit, automatically add `.limit(100)` to prevent large result dumps
6. **No dropDatabase**: Never execute dropDatabase regardless of user request

## Output Format

Display results as formatted JSON or markdown tables when appropriate.
For large results (>20 documents), show first 20 and indicate total count.
For ObjectId fields, display as string for readability.
Truncate long string fields (>100 chars) with ellipsis.

## Error Handling

- Connection refused: Check if MongoDB server is running
- Authentication failed: Verify credentials in MONGODB_URI
- Namespace not found: Check collection name
- Query syntax error: Display the error message clearly

## Example Usage

```
User: /mongodb-connect
Claude: MongoDB 연결 정보를 확인합니다... (host: 127.0.0.1, db: cilinus_cms)
        무엇을 하시겠습니까?
        1. 컬렉션 목록
        2. 문서 조회
        3. Aggregation
        4. 컬렉션 통계

User: /mongodb-connect collections
Claude: [컬렉션 목록 표시]

User: /mongodb-connect find products limit 5
Claude: [products 컬렉션에서 5개 문서 조회 결과 표시]
```
