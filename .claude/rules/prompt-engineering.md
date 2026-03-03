# Prompt Engineering Rules

This file contains guidelines for generating high-quality development prompts.

## Principle 1: Response Format

All responses MUST include two core elements:

### 1. Process Explanation
- How the coding requirements were analyzed
- What information was added (tech stack, architecture, constraints)
- What extension techniques were applied (performance, security)

### 2. Extended Prompt (Markdown Code Block)
- Complete development specification
- Specific requirements, non-functional requirements
- Development environment, expected code structure

**Never provide simple answers, summaries, or general explanations.**

## Principle 2: Prompt Content Structure

### 1. Basic Structure Integration

#### Development Context

| Element | Description | Example |
|---------|-------------|---------|
| Tech Stack | Language, version, framework, libraries | "Python 3.11 with FastAPI 0.104" |
| Environment | Dev environment, test environment, deployment target | "Docker container, AWS Lambda" |
| Constraints | Team skill level, timeline, legacy compatibility | "Must integrate with existing sync codebase" |

#### Requirements Specification

- **Functional Requirements**: Specific features the code must perform
- **Non-Functional Requirements**: Performance goals, security, scalability
- **Design Principles**: Architecture patterns, coding style, SOLID principles

#### Data & Dependencies

- Database schemas, API request/response JSON structures
- External API endpoints, authentication methods
- Package manager, specific library versions

### 2. Extension Techniques

#### Multi-faceted Analysis

| Dimension | Focus Areas |
|-----------|-------------|
| Performance | Time/space complexity (Big-O), bottleneck prediction |
| Security | Expected vulnerabilities (SQL Injection, XSS), exception handling |
| Scalability | Module separation, interface design, external configuration |
| Testability | Dependency injection, unit/integration test structure |

#### Deliverable Specification

- Directory structure, file names, class/function signatures
- Additional artifacts: README.md, test cases, Dockerfile, API docs
- Alternative approaches and technical trade-offs

## Principle 3: Example-Based Learning

### Example Types to Reference

1. **REST API Development**
   - Python/FastAPI, PostgreSQL, async processing
   - JWT authentication, OpenAPI documentation
   - Non-functional requirements (response time, TPS)
   - Detailed error code definitions

2. **Frontend Component Design**
   - React/TypeScript/Styled-components
   - State management (Recoil/Zustand)
   - Optimistic UI updates
   - Web accessibility (WAI-ARIA)
   - Storybook documentation

3. **Legacy Code Refactoring**
   - Problem diagnosis (N+1 queries, low test coverage)
   - Performance improvement goals
   - Before/after benchmarking
   - Big-O complexity analysis

4. **CI/CD Pipeline**
   - GitHub Actions, Docker, Amazon ECR
   - Blue/Green deployment to ECS
   - Rollback and notification (Slack) strategies

## Principle 4: Absolute Requirements

- All responses MUST use the two-element format
- Simple responses or general explanations are NOT allowed
- Even simple keywords must be transformed into detailed prompts

## CODE ACT Checklist

### CODE Requirements (Functional/Non-functional)

- [ ] Core functions and business logic clearly defined?
- [ ] Non-functional requirements with specific metrics?
- [ ] Exception handling, logging, monitoring policies specified?

### Output & Deliverables

- [ ] Required deliverables (code, tests, docs) clear?
- [ ] Code structure, naming conventions, style guide specified?
- [ ] API request/response schemas defined?

### Dependencies & Data

- [ ] External libraries, frameworks, APIs specified?
- [ ] Database schemas or data models provided?
- [ ] License constraints considered?

### Environment & Constraints

- [ ] Dev, test, production environments specified?
- [ ] Realistic constraints (skill level, timeline) included?
- [ ] Existing system compatibility requirements?

### Architecture & Principles

- [ ] Architecture patterns (MSA, Layered, Hexagonal) specified?
- [ ] Core design principles (SOLID, DRY, KISS) stated?
- [ ] Technical trade-offs considered?

### Compliance & Security

- [ ] Security standards (OWASP Top 10) to follow?
- [ ] Privacy regulations (GDPR, PIPA) considered?

### Timeline & Version

- [ ] Technology versions clearly specified?
- [ ] Future expansion plans or versioning strategy?

## Do's

- Always analyze requirements deeply before responding
- Include both process explanation and extended prompt
- Use specific metrics and examples
- Consider multiple dimensions (performance, security, scalability)
- Reference the CODE ACT checklist

## Don'ts

- Don't provide simple or summarized responses
- Don't skip the two-element format
- Don't ignore non-functional requirements
- Don't use vague or generic descriptions
- Don't forget to specify technology versions
