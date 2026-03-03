---
name: cms-work-done
description: 작업 완료 및 문서화 스킬. 빌드 검증, 변경 사항 분석, work_process 문서 생성을 일괄 실행한다. 작업 세션 종료 시 호출한다.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# CMS Work Done

작업 세션 종료 시 빌드 검증, 변경 분석, 문서 생성을 일괄 실행하는 행동 스킬.

**원칙:** 문서화되지 않은 작업은 존재하지 않는 작업이다.

## 1. 빌드 최종 검증

**문서화 전에 빌드가 통과해야 한다.**

```bash
# 변경 대상에 따라 실행
cd backend && npm run build
cd frontend && npm run build
```

- 빌드 실패 시 cms-build-check 스킬의 절차를 따른다.
- 빌드가 통과해야만 다음 단계로 진행한다.

## 2. 변경 사항 수집

**git diff를 통해 세션 중 변경된 모든 내용을 수집한다.**

수집 항목:
```bash
# 변경된 파일 목록
git diff --name-only HEAD

# 스테이지되지 않은 변경 포함
git status

# 변경 요약 (추가/삭제 라인 수)
git diff --stat HEAD
```

수집 결과로 다음을 정리한다:
- 수정된 파일 목록 (경로 포함)
- 각 파일의 변경 요약 (한 줄 설명)
- 새로 생성된 파일
- 삭제된 파일

## 3. work_process 문서 생성

**UTF-8 BOM 인코딩으로 work_process 문서를 생성/업데이트한다.**

### 경로 규칙

```
document/20.work_process/work_process_YYYY_MM_DD.md
```

- 오늘 날짜의 파일이 이미 있으면 하단에 추가한다.
- 없으면 새로 생성한다.
- 기존 내용을 절대 삭제하지 않는다.

### 문서 형식

```markdown
## [HH:mm] 작업 제목

### 작업 내용
- 수행한 작업에 대한 설명

### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `경로/파일명` | 변경 요약 |

### 빌드 결과
- Backend: PASS/FAIL
- Frontend: PASS/FAIL
```

### 인코딩 규칙

반드시 PowerShell의 `WriteAllLines`를 사용하여 UTF-8 BOM으로 저장한다:

```powershell
$content = @'
[문서 내용]
'@

# 기존 파일이 있으면 기존 내용 + 새 내용
$path = 'document/20.work_process/work_process_YYYY_MM_DD.md'
if (Test-Path $path) {
    $existing = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
    $content = $existing + "`n`n" + $content
}

[IO.File]::WriteAllLines($path, $content, [Text.Encoding]::UTF8)
```

Claude Code의 Write 도구를 한국어 파일에 직접 사용하지 않는다.

## 4. 커밋 준비

**변경 사항을 구조적/행위적으로 분류하여 커밋 메시지 초안을 제안한다.**

분류 규칙:
- 구조적 변경: 리네이밍, 메서드 추출, 코드 이동 (동작 변경 없음)
- 행위적 변경: 새 기능, 버그 수정, 로직 변경

커밋 메시지 형식:
```
[type]: 변경 요약 (한 줄)

- 상세 변경 내용 1
- 상세 변경 내용 2
```

type 분류:
| type | 용도 |
|------|------|
| feat | 새 기능 추가 |
| fix | 버그 수정 |
| refactor | 구조적 변경 (동작 변경 없음) |
| style | 포맷팅, 코드 스타일 변경 |
| test | 테스트 추가/수정 |
| docs | 문서 변경 |
| chore | 빌드, 설정 변경 |

커밋은 사용자의 명시적 요청이 있을 때만 실행한다. 자동으로 커밋하지 않는다.

## 실행 체크리스트

```
1. [빌드 검증] -> verify: backend + frontend 모두 PASS
2. [변경 수집] -> verify: git diff로 모든 변경 파일 파악
3. [문서 생성] -> verify: work_process 파일이 UTF-8 BOM으로 저장됨
4. [커밋 준비] -> verify: 구조/행위 분류된 커밋 메시지 초안 제시
```
