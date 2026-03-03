---
name: mysql-connect
description: MySQL 데이터베이스에 직접 연결하여 쿼리를 실행합니다. DB 조회, 테이블 구조 확인, 데이터 분석에 사용합니다. mysql, DB조회, 쿼리실행, 테이블확인 관련 작업 시 활성화됩니다.
allowed-tools: Bash, Read, AskUserQuestion
user-invocable: true
---

# MySQL Direct Connect Skill

## Overview

Backend의 `.env` 파일에서 DB 접속 정보를 읽어 mysql2 라이브러리로 직접 쿼리를 실행합니다.

## Execution Flow

### Step 1: Read Connection Config

Read the backend `.env` file to extract DB connection variables:

```
D:\Cil_WorkSpace\CMS-UI-feature-timezone\backend\.env
```

Required variables:
- `DB_HOST` - MySQL hostname
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name

### Step 2: Determine Query

If the user provided a query as an argument, use it directly.
If no argument was provided, ask the user what they want to do:

**AskUserQuestion options:**
1. **쿼리 실행** - SQL 쿼리 직접 실행
2. **테이블 목록** - 전체 테이블 목록 조회
3. **테이블 구조** - 특정 테이블의 컬럼 정보 조회
4. **데이터 조회** - 특정 테이블 데이터 샘플 조회

### Step 3: Execute Query via Node Script

Use the project's existing `mysql2` package to run queries. Execute from the `backend` directory.

**Query execution template:**

```bash
cd /d/Cil_WorkSpace/CMS-UI-feature-timezone/backend && node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'DB_HOST_VALUE',
    port: DB_PORT_VALUE,
    user: 'DB_USER_VALUE',
    password: 'DB_PASSWORD_VALUE',
    database: 'DB_NAME_VALUE',
  });
  try {
    const [rows] = await conn.execute(QUERY_HERE);
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await conn.end();
  }
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
"
```

### Common Queries by Option

#### Option 1: 쿼리 실행
Ask user for the SQL query, then execute it.

#### Option 2: 테이블 목록
```sql
SHOW TABLES
```

#### Option 3: 테이블 구조
Ask user for table name, then:
```sql
DESCRIBE <table_name>
```
And optionally:
```sql
SHOW CREATE TABLE <table_name>
```

#### Option 4: 데이터 조회
Ask user for table name, then:
```sql
SELECT * FROM <table_name> LIMIT 20
```

## Safety Rules

1. **READ-ONLY by default**: Only SELECT, SHOW, DESCRIBE, EXPLAIN queries are allowed without confirmation
2. **Write operations require confirmation**: INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE, CREATE must prompt user with AskUserQuestion before executing
3. **Never log passwords**: When displaying connection info, mask the password
4. **Timeout**: Set query timeout to 30 seconds
5. **Result limit**: For SELECT queries without LIMIT, automatically add `LIMIT 100` to prevent large result dumps
6. **No DROP DATABASE**: Never execute DROP DATABASE regardless of user request

## Output Format

Display results as a formatted markdown table when possible.
For large results (>20 rows), show first 20 rows and indicate total count.
For schema queries (DESCRIBE), format as a clear table with column details.

## Error Handling

- Connection refused: Check if MySQL server is running
- Access denied: Verify credentials in .env
- Unknown database: Check DB_NAME value
- Query syntax error: Display the error message clearly

## Example Usage

```
User: /mysql-connect
Claude: DB 연결 정보를 확인합니다... (DB_HOST: 127.0.0.1, DB_NAME: cms_cilinus)
        무엇을 하시겠습니까?
        1. 쿼리 실행
        2. 테이블 목록
        3. 테이블 구조
        4. 데이터 조회

User: /mysql-connect SHOW TABLES
Claude: [테이블 목록 결과 표시]

User: /mysql-connect SELECT * FROM users LIMIT 5
Claude: [쿼리 결과를 테이블로 표시]
```
