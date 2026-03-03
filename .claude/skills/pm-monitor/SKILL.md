---
name: pm-monitor
description: PM 감독 모니터링 도구입니다. 모든 워크트리의 작업 상태를 추적하고, 완료된 브랜치를 develop에 자동 머지합니다. pm, monitor, 감독, 모니터링, worktree 상태 관련 작업 시 활성화됩니다.
allowed-tools: Bash, Read, AskUserQuestion, Glob, Grep
user-invocable: true
---

# PM Monitor - 워크트리 감독 Skill

## 개요
모든 Git Worktree의 작업 진행 상태를 추적하고, 완료된 feature 브랜치를 develop에 자동 머지하는 PM 감독 도구입니다.

## 인자(args) 처리

스킬 호출 시 args를 파싱하여 동작을 결정합니다:

| 인자 | 동작 |
|------|------|
| (없음) | 대화형 메뉴 표시 |
| `start` | 5분 간격 자동 모니터링 시작 |
| `stop` | 실행 중인 모니터링 종료 |
| `status` | 현재 상태 즉시 보고 |
| `report` | 최신 로그 전체 출력 |
| `merge` | 수동 머지 점검 실행 |

## 실행 시 동작

### args가 없는 경우: 대화형 메뉴

AskUserQuestion을 사용하여 메뉴를 표시합니다:

**질문**: "PM Monitor 작업을 선택해주세요."
**옵션**:
1. **Start** - 5분 간격 자동 모니터링 시작
2. **Stop** - 실행 중인 모니터링 종료
3. **Status** - 현재 워크트리 상태 즉시 보고
4. **Report** - 최신 모니터링 로그 전체 출력

---

### 동작 1: Start (모니터링 시작)

#### 1-1. 기존 프로세스 확인
```bash
powershell -Command "Get-Content 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -ErrorAction SilentlyContinue"
```
- PID 파일이 존재하고 프로세스가 살아있으면: "이미 실행 중입니다 (PID: xxx)" 안내
- 아니면 계속 진행

#### 1-2. 모니터 스크립트 실행
```bash
powershell -Command "
  $proc = Start-Process -FilePath 'C:\Program Files\Git\bin\bash.exe' -ArgumentList '-c','D:/Cil_WorkSpace/CMS-UI/pm_monitor.sh' -WindowStyle Hidden -PassThru;
  $proc.Id | Out-File -FilePath 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -NoNewline;
  Write-Output $proc.Id
"
```

#### 1-3. 시작 확인
```bash
sleep 3
```
로그 파일 `D:/Cil_WorkSpace/CMS-UI/pm_monitor.log`의 마지막 줄을 읽어 정상 시작 확인 후 보고:
- "PM Monitor 시작됨 (PID: xxx, 5분 간격)"

---

### 동작 2: Stop (모니터링 종료)

#### 2-1. PID 파일에서 프로세스 ID 읽기
```bash
powershell -Command "Get-Content 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -ErrorAction SilentlyContinue"
```

#### 2-2. 프로세스 종료
```bash
powershell -Command "
  $pid = Get-Content 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -ErrorAction SilentlyContinue;
  if ($pid) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue;
    Remove-Item 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -Force;
    Write-Output 'Stopped'
  } else {
    Write-Output 'Not running'
  }
"
```

#### 2-3. 결과 보고
- 종료 성공: "PM Monitor 종료됨"
- 실행 중이 아닌 경우: "PM Monitor가 실행 중이 아닙니다"

---

### 동작 3: Status (즉시 상태 보고)

모니터링 프로세스 실행 여부와 관계없이, 현재 시점의 모든 워크트리 상태를 즉시 점검합니다.

#### 3-1. 워크트리 목록 조회
```bash
git worktree list
```

#### 3-2. 각 워크트리 순차(--seq) 점검
main과 develop을 제외한 각 feature 워크트리에 대해:

```bash
cd <worktree_path>
git branch --show-current
git rev-parse --short HEAD
git log -1 --format="%s (%ci)"
git status --short
git log develop..HEAD --oneline
```

#### 3-3. develop 상태 점검
```bash
cd D:/Cil_WorkSpace/CMS-UI-staging
git status --short
git log -1 --format="%h %s"
```

#### 3-4. 모니터 프로세스 상태 확인
```bash
powershell -Command "
  $pid = Get-Content 'D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid' -ErrorAction SilentlyContinue;
  if ($pid) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue;
    if ($proc) { Write-Output \"Running (PID: $pid)\" } else { Write-Output 'Dead (stale PID)' }
  } else { Write-Output 'Not running' }
"
```

#### 3-5. 결과를 테이블 형태로 보고

보고 형식:
```
## PM 감독 보고 - Status (HH:MM KST)

### 모니터링 프로세스: [Running/Stopped]

| 워크트리 | 브랜치 | 상태 | HEAD | 최근 커밋 | develop 대비 |
|----------|--------|------|------|-----------|-------------|
| ... | ... | Clean/In Progress (N files) | ... | ... | +N commits / Up to date |

### 주목사항
- (변경사항, 경고, 머지 대기 등)
```

---

### 동작 4: Report (로그 출력)

#### 4-1. 로그 파일 읽기
`D:/Cil_WorkSpace/CMS-UI/pm_monitor.log` 파일의 마지막 사이클 내용을 Read 도구로 읽어서 표시합니다.

로그 파일이 없으면: "모니터링 로그가 없습니다. `/pm-monitor start`로 모니터링을 시작해주세요."

---

### 동작 5: Merge (수동 머지 점검)

#### 5-1. 모든 feature 워크트리 점검
각 feature 워크트리에 대해:
- working tree가 clean인지 확인
- develop 대비 새 커밋이 있는지 확인

#### 5-2. 머지 대상 발견 시
AskUserQuestion으로 확인:

**질문**: "다음 브랜치를 develop에 머지하시겠습니까?"
**옵션**: 발견된 브랜치 목록 + "전체 머지" + "취소"

#### 5-3. 머지 실행
```bash
cd D:/Cil_WorkSpace/CMS-UI-staging
git merge <branch_name> --no-edit
```

성공/실패 결과 보고. 충돌 시 `git merge --abort` 후 안내.

---

## 파일 경로

| 파일 | 용도 |
|------|------|
| `D:/Cil_WorkSpace/CMS-UI/pm_monitor.sh` | 백그라운드 모니터 스크립트 |
| `D:/Cil_WorkSpace/CMS-UI/pm_monitor.log` | 모니터링 로그 |
| `D:/Cil_WorkSpace/CMS-UI/pm_monitor.pid` | 실행 중 프로세스 ID |
| `D:/Cil_WorkSpace/CMS-UI/pm_state.txt` | HEAD 상태 추적 |
| `D:/Cil_WorkSpace/CMS-UI/pm_merged.txt` | 머지 완료 이력 |

## 모니터 스크립트 자동 감지 규칙

| 조건 | 판정 | 동작 |
|------|------|------|
| working tree dirty | IN_PROGRESS | 수정 중 파일 목록 기록 |
| working tree clean + develop 대비 새 커밋 | COMPLETED | develop에 자동 머지 시도 |
| working tree clean + develop과 동일 | UP_TO_DATE | 기록만 |
| HEAD 변경 감지 | NEW_COMMITS | 신규 커밋 내역 기록 |
| 머지 충돌 | CONFLICT | abort 후 수동 개입 필요 기록 |

## 호칭 규칙

보고 시 항상:
- 사용자를 "주상전하"로 호칭
- 자신을 "신 클로드"로 호칭
- 보고서 시작/끝에 호칭 포함

## 사용 예시

```
사용자: /pm-monitor
Claude: (대화형 메뉴 표시)

사용자: /pm-monitor start
Claude: PM Monitor 시작됨 (PID: 12345, 5분 간격)

사용자: /pm-monitor status
Claude: ## PM 감독 보고 - Status (14:30 KST)
        (전체 워크트리 상태 테이블 출력)

사용자: /pm-monitor stop
Claude: PM Monitor 종료됨

사용자: /pm-monitor merge
Claude: (머지 대상 브랜치 확인 후 실행)
```
