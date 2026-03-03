---
name: worktree
description: Git Worktree 관리를 위한 대화형 도구입니다. 병렬 브랜치 작업, hotfix, 기능 개발용 worktree 생성/삭제를 지원합니다. worktree, 워크트리, 병렬작업, parallel 관련 작업 시 활성화됩니다.
allowed-tools: Bash, AskUserQuestion, Read
user-invocable: true
---

# Git Worktree 관리 Skill

## 개요
Git Worktree를 활용한 병렬 브랜치 작업을 지원하는 대화형 도구입니다.

## 실행 시 동작

### 1단계: 현재 상태 확인
먼저 현재 worktree 목록을 확인합니다:
```bash
git worktree list
```

### 2단계: 대화형 메뉴 표시
AskUserQuestion을 사용하여 다음 메뉴를 표시합니다:

**질문**: "Git Worktree 작업을 선택해주세요."
**옵션**:
1. **새 worktree 생성** - 새로운 브랜치 작업 공간 생성
2. **현재 worktree 목록** - 모든 worktree 상태 확인
3. **worktree 삭제** - 사용 완료된 worktree 제거
4. **전체 정리** - 모든 추가 worktree 삭제

### 3단계: 선택에 따른 동작

#### 옵션 1: 새 worktree 생성
추가 질문으로 용도를 확인합니다:

**질문**: "어떤 용도의 worktree를 생성할까요?"
**옵션**:
- **Hotfix** - main 브랜치 기반 긴급 수정용
- **Feature** - 현재 브랜치 기반 새 기능 개발용
- **Review** - 특정 브랜치 코드 리뷰용
- **Custom** - 직접 브랜치 지정

**생성 명령**:
```bash
# Hotfix (main 기반)
git worktree add ../CMS-UI-hotfix main

# Feature (현재 브랜치 기반, 새 브랜치 생성)
git worktree add -b feature/<이름> ../CMS-UI-feature-<이름>

# Review (특정 브랜치)
git worktree add ../CMS-UI-review <브랜치명>

# Custom
git worktree add ../CMS-UI-<이름> <브랜치명>
```

#### 옵션 2: 현재 worktree 목록
```bash
git worktree list
```
결과를 테이블 형태로 정리하여 표시합니다.

#### 옵션 3: worktree 삭제
현재 worktree 목록을 보여주고 삭제할 항목을 선택하게 합니다.

**주의**: 메인 worktree(CMS-UI)는 삭제 대상에서 제외합니다.

```bash
git worktree remove <경로>
```

#### 옵션 4: 전체 정리
메인을 제외한 모든 worktree를 삭제합니다.

```bash
git worktree list | grep -v "CMS-UI " | awk '{print $1}' | xargs -I {} git worktree remove {}
git worktree prune
```

## Worktree 경로 규칙

| 용도 | 폴더명 | 예시 |
|------|--------|------|
| Hotfix | CMS-UI-hotfix | ../CMS-UI-hotfix |
| Feature | CMS-UI-feature-<이름> | ../CMS-UI-feature-login |
| Review | CMS-UI-review | ../CMS-UI-review |
| Custom | CMS-UI-<이름> | ../CMS-UI-experiment |

## 주의사항

1. **같은 브랜치 중복 체크아웃 불가**
   - 이미 체크아웃된 브랜치는 다른 worktree에서 사용 불가

2. **node_modules 별도 설치 필요**
   - 새 worktree 생성 후 `npm install` 필요

3. **삭제 전 커밋 확인**
   - 미커밋 변경사항이 있으면 경고 표시

## 사용 예시

```
사용자: /worktree

Claude: 현재 worktree 목록:
| 경로 | 브랜치 | 커밋 |
|------|--------|------|
| D:/Cil_WorkSpace/CMS-UI | timezone_dev | 91f4964 |

Git Worktree 작업을 선택해주세요.
> 1. 새 worktree 생성
> 2. 현재 worktree 목록
> 3. worktree 삭제
> 4. 전체 정리

사용자: 1번

Claude: 어떤 용도의 worktree를 생성할까요?
> 1. Hotfix (main 기반)
> 2. Feature (새 기능)
> 3. Review (코드 리뷰)
> 4. Custom (직접 지정)

사용자: 1번

Claude: Hotfix worktree를 생성합니다...
[명령 실행]
완료! ../CMS-UI-hotfix 에서 main 브랜치 작업 가능합니다.
```

## 관련 Git 명령어 참조

| 명령어 | 설명 |
|--------|------|
| `git worktree add <경로> <브랜치>` | worktree 생성 |
| `git worktree add -b <새브랜치> <경로>` | 새 브랜치와 함께 생성 |
| `git worktree list` | 목록 확인 |
| `git worktree remove <경로>` | 삭제 |
| `git worktree prune` | 삭제된 폴더 정리 |
