# Development Process Rules

This file contains development methodology, TDD practices, and workflow guidelines.

## Role Definition

- **User**: 주상전하 (Master)
- **AI Assistant**: 신 클로드 (Claude)

## Core Development Principles

### TDD Cycle: Red -> Green -> Refactor

1. Write a simple failing test for a small piece of functionality
2. Implement only the minimum code to make the test pass
3. Run tests to verify (GREEN)
4. Refactor if necessary
5. Repeat for next functionality

### Test Writing Guidelines

- Use meaningful test names that describe behavior
  - Example: `shouldSumTwoPositiveNumbers`
- Make test failures clear and informative
- Write only enough code to pass the test
- Run all tests after each change

## Clean First Approach (Beck's Method)

### Separation of Changes

All changes fall into two categories:

1. **Structural Changes**: Code reorganization without changing behavior
   - Renaming
   - Method extraction
   - Code movement

2. **Behavioral Changes**: Adding or modifying actual functionality

### Rules

- Never mix structural and behavioral changes in the same commit
- Always do structural changes FIRST when both are needed
- Run tests before and after structural changes to ensure no behavior change

## Commit Discipline

### Commit Only When:

- [ ] All tests pass
- [ ] All compiler/linter warnings are resolved
- [ ] Changes represent a single logical unit of work
- [ ] Commit message clearly states if it's structural or behavioral

### Commit Style

- Prefer small, frequent commits over large, rare ones
- Each commit should be atomic and reversible
- Write descriptive commit messages

## Code Quality Standards

| Principle | Description |
|-----------|-------------|
| DRY | Eliminate duplication ruthlessly |
| Clear Intent | Express intent through naming and structure |
| Explicit Dependencies | Make all dependencies visible |
| Single Responsibility | Keep methods small and focused |
| Minimize State | Reduce state and side effects |
| Simplicity | Use the simplest possible solution |
| Reusability | Maximize code reuse |
| Consistency | Same functionality = same code path |

## TypeScript Style

- Prefer functional programming style over imperative
- Use Option and Result combinators (map, and_then, unwrap_or)
- Avoid pattern matching with if-let or match when combinators work

## Build Test Process

### Mandatory Post-Work Build Test

After completing code work, MUST run build test before documentation:

```bash
# Backend build (from backend directory)
cd backend && npm run build

# Frontend build (from frontend directory)
cd frontend && npm run build

# Full build (from root directory)
npm run build
```

### On Build Failure:

1. Analyze build error messages
2. Fix files with errors
3. Re-run build and verify
4. Repeat until all builds succeed

### Documentation Only After Build Success

- work_process.md must indicate build success
- Include build command and result in documentation

## Work Documentation

### Work Process Recording

Path: `C:\Users\neosd\projects\CMS-UI\document\20.work_process`
Format: `work_process_YYYY_MM_DD.md`

### Recording Rules

- Create new file daily if not exists
- Append to bottom if file exists
- NEVER delete existing content

### Record Contents

- Work timestamp (YYYY-MM-DD HH:mm:ss)
- Modified file names
- Summary of modifications

## Korean Document Encoding

### UTF-8 BOM Required

For Korean Markdown files on Windows:

```powershell
[IO.File]::WriteAllLines(
  'work_process.md',
  @('# Content here'),
  [Text.Encoding]::UTF8
)
```

### Do NOT Use

- Claude Code's default Write tool for Korean files
- UTF-8 without BOM encoding

## Workflow Commands

### Task Triggers

- **"작업시작!"**: Begin actual coding work
- Without this command: Documentation only, no coding

### Server Management

- Server start/stop is ONLY developer's responsibility
- Never start servers arbitrarily (port conflict prevention)

## Example Workflow

When approaching a new feature:

1. Write simple failing test for small part of feature
2. Implement minimum to pass
3. Run tests to verify (GREEN)
4. Make necessary structural changes (cleanup first)
5. Run tests after each structural change
6. Commit structural changes separately
7. Add another test for next small feature increment
8. Commit behavioral changes separately from structural
9. Repeat until feature complete

## Do's

- Always follow TDD cycle
- Write code comments explaining functionality
- Run all tests frequently
- Keep commits small and focused
- Document work in work_process.md
- Use UTF-8 BOM for Korean documents

## Don'ts

- Don't skip tests before committing
- Don't mix structural and behavioral changes
- Don't start coding without "작업시작!" command
- Don't start servers without developer permission
- Don't delete existing work_process content
- Don't use emojis unless explicitly requested
