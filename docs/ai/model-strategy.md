# 모델 전략

## 📋 개요

비용 vs 품질 최적화. 3-tier 폴백 체인으로 안정성 확보.

---

## 🏗️ 모델 티어 구조

```
┌─────────────────────────────────────────────────┐
│                  모델 선택 전략                    │
├─────────────────────────────────────────────────┤
│                                                  │
│   Tier 1: 프리미엄 (유료 콘텐츠)                  │
│   ┌───────────────────────────────────────┐      │
│   │  Claude 4 Sonnet / GPT-4o             │      │
│   │  • 최고 품질, 한국어 우수               │      │
│   │  • 비용: $3-15 / 1M tokens             │      │
│   └───────────────────────────────────────┘      │
│                      │ 실패 시                    │
│                      ▼                           │
│   Tier 2: 경량 (무료 콘텐츠)                      │
│   ┌───────────────────────────────────────┐      │
│   │  Claude Haiku / GPT-4o-mini           │      │
│   │  • 준수한 품질, 빠른 응답               │      │
│   │  • 비용: $0.25-1.25 / 1M tokens        │      │
│   └───────────────────────────────────────┘      │
│                      │ 실패 시                    │
│                      ▼                           │
│   Tier 3: 로컬 (비용 제로)                        │
│   ┌───────────────────────────────────────┐      │
│   │  Llama 3.1 8B / Qwen 2.5 (Ollama)    │      │
│   │  • 기본 품질, 비용 무료                  │      │
│   │  • GPU 서버 필요 (또는 CPU 추론)        │      │
│   └───────────────────────────────────────┘      │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 💰 비용 시뮬레이션

### 단일 에피소드 생성 비용

| 모델 | 입력 토큰 | 출력 토큰 | 에피소드 비용 | 월 1,000화 |
|------|----------|----------|-------------|-----------|
| Claude Sonnet 4 | ~2,000 | ~3,000 | $0.051 | **$51** |
| GPT-4o | ~2,000 | ~3,000 | $0.035 | **$35** |
| Claude Haiku | ~2,000 | ~3,000 | $0.004 | **$4** |
| GPT-4o-mini | ~2,000 | ~3,000 | $0.002 | **$2** |
| Llama 3.1 (로컬) | ~2,000 | ~3,000 | $0 | **$0** (GPU 비용 별도) |

> 가정: 입력 ~2,000 토큰 (프롬프트+컨텍스트), 출력 ~3,000 토큰 (본문 3,000-5,000자)

### MVP 단계 월간 AI 비용 예상

| 시나리오 | 유료 콘텐츠 | 무료 콘텐츠 | 월 총 비용 |
|---------|-----------|-----------|-----------|
| **최소** (일 10화) | 5화 × Sonnet | 5화 × Haiku | ~$9 |
| **기본** (일 30화) | 10화 × Sonnet | 20화 × Haiku | ~$18 |
| **성장** (일 100화) | 30화 × Sonnet | 70화 × Haiku | ~$55 |
| **스케일** (일 500화) | 100화 × Sonnet | 400화 × 로컬 | ~$155 |

---

## 🎯 모델 선택 로직

```python
# app/config.py

MODEL_TIERS = {
    "premium": {
        "models": [
            {"provider": "anthropic", "model": "claude-sonnet-4-6", "priority": 1},
            {"provider": "openai", "model": "gpt-4o", "priority": 2},
        ],
        "max_tokens": 4000,
        "temperature": 0.8,
    },
    "standard": {
        "models": [
            {"provider": "anthropic", "model": "claude-haiku-4-5-20251001", "priority": 1},
            {"provider": "openai", "model": "gpt-4o-mini", "priority": 2},
        ],
        "max_tokens": 4000,
        "temperature": 0.85,
    },
    "local": {
        "models": [
            {"provider": "ollama", "model": "llama3.1:8b", "priority": 1},
            {"provider": "ollama", "model": "qwen2.5:7b", "priority": 2},
        ],
        "max_tokens": 4000,
        "temperature": 0.9,
    },
}

def select_tier(content_type: str, is_paid: bool) -> str:
    """콘텐츠 유형에 따른 모델 티어 선택"""
    if is_paid:
        return "premium"
    elif content_type == "synopsis":
        return "standard"  # 시놉시스는 짧으므로 경량 모델
    else:
        return "standard"  # 무료 콘텐츠는 경량 모델
```

---

## 🔄 폴백 체인

```python
# app/generators/model_selector.py

class ModelSelector:
    """폴백 체인을 가진 모델 선택기"""

    def __init__(self):
        self.providers = {
            "anthropic": AnthropicProvider(),
            "openai": OpenAIProvider(),
            "ollama": OllamaProvider(),
        }
        self.failure_counts: dict[str, int] = {}  # 모델별 실패 횟수 (서킷 브레이커)

    async def generate(self, tier: str, prompt: str, max_tokens: int) -> dict:
        config = MODEL_TIERS[tier]

        for model_config in config["models"]:
            model_key = f"{model_config['provider']}:{model_config['model']}"

            # 서킷 브레이커: 최근 5분간 3회 이상 실패 시 건너뜀
            if self.failure_counts.get(model_key, 0) >= 3:
                continue

            try:
                provider = self.providers[model_config["provider"]]
                result = await provider.generate(
                    model=model_config["model"],
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=config["temperature"],
                )
                # 성공 시 실패 카운트 리셋
                self.failure_counts[model_key] = 0
                return result

            except Exception as e:
                self.failure_counts[model_key] = self.failure_counts.get(model_key, 0) + 1
                print(f"Model {model_key} failed: {e}")
                continue

        # 모든 모델 실패 시 → 로컬 티어로 재시도
        if tier != "local":
            return await self.generate("local", prompt, max_tokens)

        raise Exception("All models failed")
```

---

## 📊 A/B 테스트 전략

### 테스트 항목

| 테스트 | 변수 A | 변수 B | 측정 지표 |
|--------|-------|-------|----------|
| 모델 품질 | Claude Sonnet | GPT-4o | 사용자 평점, 이탈률 |
| 온도 | 0.7 | 0.9 | 콘텐츠 다양성, 만족도 |
| 프롬프트 | 상세 장르 지시 | 최소 지시 | 장르 적합성, 품질 |
| 분량 | 3,000자 | 5,000자 | 완독률, 다음화 클릭 |

### 구현

```python
import hashlib
import random

class ABTest:
    def __init__(self, test_name: str, variants: list[str], weights: list[float] = None):
        self.test_name = test_name
        self.variants = variants
        self.weights = weights or [1.0 / len(variants)] * len(variants)

    def assign(self, user_id: str) -> str:
        """사용자별 일관된 변형 할당 (해시 기반)"""
        hash_val = int(hashlib.md5(f"{self.test_name}:{user_id}".encode()).hexdigest(), 16)
        bucket = hash_val % 100

        cumulative = 0
        for i, weight in enumerate(self.weights):
            cumulative += weight * 100
            if bucket < cumulative:
                return self.variants[i]

        return self.variants[-1]

# 사용 예시
model_test = ABTest("model_quality_v1", ["claude-sonnet", "gpt-4o"], [0.5, 0.5])
selected = model_test.assign(user_id="user123")  # 항상 같은 결과
```

---

## 🛡️ 안전성 & 모니터링

### 콘텐츠 필터링

```python
async def safety_check(content: str) -> dict:
    """생성 콘텐츠 안전성 검사"""
    checks = {
        "profanity": check_profanity(content),
        "hate_speech": check_hate_speech(content),
        "adult_content": check_adult_content(content),
        "personal_info": check_pii(content),
    }

    is_safe = all(not v for v in checks.values())
    return {"is_safe": is_safe, "flags": checks}
```

### 비용 모니터링

```python
# 일일 비용 제한
DAILY_COST_LIMIT = {
    "premium": 10.0,   # $10/일
    "standard": 5.0,   # $5/일
    "local": float("inf"),
}

async def check_budget(tier: str, estimated_cost: float) -> bool:
    """일일 예산 초과 확인"""
    today_key = f"cost:{tier}:{date.today().isoformat()}"
    current = float(await redis.get(today_key) or 0)

    if current + estimated_cost > DAILY_COST_LIMIT[tier]:
        # 예산 초과 → 하위 티어로 다운그레이드
        return False

    await redis.incrbyfloat(today_key, estimated_cost)
    await redis.expire(today_key, 86400 * 2)
    return True
```

---

## 🔮 향후 계획

| 단계 | 내용 | 시기 |
|------|------|------|
| **MVP** | Claude Sonnet + Haiku 2-tier | Phase 1 |
| **Phase 2** | 로컬 모델 추가, A/B 테스트 시작 | Phase 2 |
| **Phase 3** | 파인튜닝 (장르별 특화 모델) | Phase 3 |
| **Phase 4** | 만화 생성 (이미지 모델 통합) | Phase 3+ |

---

*관련 문서: [ai-pipeline.md](./ai-pipeline.md) - 생성 파이프라인, [prompt-engineering.md](./prompt-engineering.md) - 프롬프트*
