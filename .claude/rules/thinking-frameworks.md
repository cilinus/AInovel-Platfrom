# Thinking Frameworks for TypeScript & React Development

This file contains cognitive frameworks and formulas for solving complex development problems.

## Usage Guidelines

When receiving requirements, ideas, or feature implementation requests:
1. Define the problem clearly
2. Select 1-2 most appropriate formulas
3. Apply variables to analyze quantitatively/qualitatively
4. Derive concrete solutions
5. Iterate and improve using Dev-Insight Amplification

---

## 1. Genius Code-Insight Formula (GCI)

### Purpose
Deep insight extraction for complex code refactoring and new feature implementation.

### Formula
```
GCI = (CR x AI x DP x SA) / (TC + PH)
```

| Variable | Description | Scale |
|----------|-------------|-------|
| GCI | Genius Code-Insight (result) | - |
| CR | Code Review depth | 1-10 |
| AI | API/Component Integration creativity | 1-10 |
| DP | Design Pattern recognition & application | 1-10 |
| SA | System Architecture synthesis | 1-10 |
| TC | Technical Convention lock-in level | 1-10 |
| PH | Personal Habit/stack preference bias | 1-10 |

### Application
Score each element, minimize TC and PH, follow sequence:
Code Review -> Integration -> Pattern Application -> Architecture Synthesis

---

## 2. Multi-Dimensional Architecture Framework (MDA)

### Purpose
Multi-angle analysis for new projects or feature tech stack/structure design.

### Formula
```
MDA = Sum[Di x Wi x Ii] (i=1 to 5)
```

| Variable | Description |
|----------|-------------|
| MDA | Multi-Dimensional Analysis result |
| Di | Technical insight in dimension i |
| Wi | Weight of dimension i (project importance) |
| Ii | Impact of dimension i (performance, cost, scalability) |

### Analysis Dimensions

| Dimension | Focus Areas |
|-----------|-------------|
| D1 (Frontend) | React component structure, State Management, UX/UI |
| D2 (Backend) | Node.js API design, business logic, DB interaction |
| D3 (Database) | Data modeling, query optimization, scalability |
| D4 (Infrastructure) | Deployment, cloud services (AWS, GCP), CI/CD |
| D5 (DX) | TypeScript type system, code quality, testability |

---

## 3. Creative Connection Matrix (CC)

### Purpose
Design efficient and creative connection structures between components or microservices.

### Formula
```
CC = |Service A intersection B| + |A XOR B| + f(A->B)
```

| Variable | Description |
|----------|-------------|
| CC | Creative Connection index |
| A intersection B | Common data models or functions |
| A XOR B | Mutually exclusive unique elements |
| f(A->B) | Data flow or call function (coupling, latency) |

### Connection Exploration Process

1. **Direct Connection**: REST API, gRPC direct calls
2. **Indirect Connection**: Message queue (RabbitMQ, Kafka), Event Bus
3. **Paradoxical Connection**: Unconventional flows (Read-heavy -> Write-heavy)
4. **Metaphorical Connection**: Data streams as "rivers" in pipelines
5. **Systemic Connection**: Connections contributing to overall stability/scalability

---

## 4. Bug Redefinition Algorithm (BR)

### Purpose
Find root causes of complex bugs by redefining the problem itself.

### Formula
```
BR = B0 x T(theta) x S(phi) x M(psi)
```

| Variable | Description |
|----------|-------------|
| BR | Redefined Bug |
| B0 | Initially reported bug phenomenon |
| T(theta) | Perspective rotation (Frontend <-> Backend, User <-> Developer) |
| S(phi) | Scope adjustment (specific user <-> entire system) |
| M(psi) | Meta-level shift (code <-> infrastructure <-> business logic) |

### Redefinition Techniques

| Technique | Example |
|-----------|---------|
| Opposite perspective (theta=180deg) | "Data not visible" -> "Data being incorrectly hidden" |
| Scale up/down (phi=0.1x~10x) | Component issue -> State management system issue |
| Level shift (psi=+-1) | "API call failure" -> "Network auth/authorization problem" |
| Domain switch | "UI bug" -> "Backend data format error" |

---

## 5. Innovative Solution Formula (IS)

### Purpose
Derive innovative solutions for tech debt resolution and performance optimization.

### Formula
```
IS = Sum[Ci x Ni x Fi x Vi] / Ri
```

| Variable | Description |
|----------|-------------|
| IS | Innovative Solution index |
| Ci | New library/framework combination |
| Ni | Technology stack novelty |
| Fi | Feasibility (team skill, compatibility) |
| Vi | Value creation (performance, dev speed) |
| Ri | Risk factors (security, stability, migration cost) |

### Solution Generation Methods

- **New Combinations**: Creative pairing of React-Query and Zustand
- **Cross-domain Borrowing**: Game engine rendering techniques for web
- **Constraint Utilization**: Maximize performance assuming low-spec environment
- **Reverse Thinking**: "How to make the service slowest?" to identify bottlenecks

---

## 6. Dev-Insight Amplification (IA)

### Purpose
Develop initial ideas through pair programming, code review, and technical discussions.

### Formula
```
IA = I0 x (1 + r)^n x C x Q
```

| Variable | Description |
|----------|-------------|
| IA | Amplified Development Insight |
| I0 | Initial idea or code draft |
| r | Refactoring/improvement iteration rate |
| n | Number of Commits/PRs |
| C | Collaboration effect (Pair: 2, Team discussion: 3) |
| Q | Quality of code review questions (1-5) |

### Amplification Strategies

- **5 Whys**: "Why did we choose this technology?" - explore root reasons
- **What If Scenarios**: "If traffic increases 100x?"
- **How Might We**: "How can we make this component more reusable?"
- **Cross-role Discussions**: Discuss with Backend, DevOps perspectives
- **Similar Case Study**: Explore open source problem-solving examples

---

## 7. Developer's Growth Equation (GE)

### Purpose
Design roadmap for continuous growth as a developer.

### Formula
```
GE = S0 + Integral[L(t) + E(t) + R(t)]dt
```

| Variable | Description |
|----------|-------------|
| GE | Growth Evolution (evolved capability) |
| S0 | Initial tech stack and capability |
| L(t) | Learning function (docs, blogs, courses) |
| E(t) | Experience accumulation (projects, side projects) |
| R(t) | Retrospective function (code review, post-mortems) |

### Growth Catalysts

| Catalyst | Activities |
|----------|-----------|
| Continuous Learning | TypeScript, React latest trends |
| Diverse Experience | New projects, maintenance, open source contribution |
| Deep Retrospection | Analyze own code pros/cons, accept peer feedback |
| Intellectual Exchange | Developer communities, study groups, conferences |
| Learning from Failure | Bug/incident root cause analysis, prevention measures |

---

## Framework Selection Guide

| Problem Type | Recommended Frameworks |
|--------------|----------------------|
| Bug Resolution | Bug Redefinition Algorithm |
| New Feature | GCI + MDA |
| Refactoring | GCI + Innovative Solution |
| Architecture Design | MDA + Creative Connection |
| Performance Optimization | Innovative Solution + Bug Redefinition |
| Team Collaboration | Dev-Insight Amplification |
| Career Development | Developer's Growth Equation |

## Do's

- Select 1-2 appropriate frameworks per problem
- Apply variables with current situation data
- Iterate solutions with team feedback
- Document framework application results

## Don'ts

- Don't apply frameworks mechanically without context
- Don't ignore qualitative factors for quantitative scores
- Don't skip the iteration and improvement step
- Don't use all frameworks at once
