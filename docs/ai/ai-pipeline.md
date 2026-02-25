# AI 생성 파이프라인

## 📋 개요

FastAPI 기반 AI 서비스. NestJS 백엔드에서 HTTP로 호출.
BullMQ로 비동기 작업 큐잉, 완료 시 웹훅 콜백.

---

## 🏗️ 파이프라인 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   NestJS    │────>│   BullMQ     │────>│   FastAPI        │
│   Backend   │     │   Queue      │     │   AI Service     │
│             │<────│   (Redis)    │<────│                  │
│  POST /ai/  │     │              │     │  /generate       │
│  generate   │     │  Job Status  │     │  /continue       │
└─────────────┘     └──────────────┘     │  /synopsis       │
                                          └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │   LLM Provider  │
                                          ├─────────────────┤
                                          │ Claude 4 Sonnet │
                                          │ GPT-4o (폴백)   │
                                          │ Ollama (로컬)   │
                                          └─────────────────┘
```

---

## 📡 FastAPI 서비스 구조

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import generation, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작: LLM 클라이언트 초기화
    from app.generators.novel_generator import NovelGenerator
    app.state.novel_generator = NovelGenerator()
    yield
    # 종료: 리소스 정리

app = FastAPI(
    title="AINovel AI Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(generation.router, prefix="/api/v1")
app.include_router(health.router, prefix="/health")
```

### config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # LLM
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # 기본 모델
    PRIMARY_MODEL: str = "claude-sonnet-4-6"
    FALLBACK_MODEL: str = "gpt-4o"
    LOCAL_MODEL: str = "llama3.1:8b"

    # 생성 설정
    MAX_TOKENS: int = 4000
    TEMPERATURE: float = 0.8

    # 서비스
    BACKEND_URL: str = "http://localhost:3001"
    BACKEND_WEBHOOK_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 📝 소설 생성기

### novel_generator.py

```python
import anthropic
import openai
import httpx
from typing import AsyncGenerator

from app.config import settings
from app.prompts.templates import get_novel_prompt, get_continuation_prompt

class NovelGenerator:
    def __init__(self):
        self.anthropic = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.openai = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_episode(
        self,
        genre: str,
        title: str,
        synopsis: str,
        previous_context: str | None = None,
        episode_number: int = 1,
        style: str = "default",
        max_tokens: int = 4000,
    ) -> dict:
        """단일 에피소드 생성"""
        prompt = get_novel_prompt(
            genre=genre,
            title=title,
            synopsis=synopsis,
            previous_context=previous_context,
            episode_number=episode_number,
            style=style,
        )

        # 1차: Claude 시도
        try:
            result = await self._generate_with_claude(prompt, max_tokens)
            return {
                "content": result["content"],
                "model": settings.PRIMARY_MODEL,
                "prompt_tokens": result["usage"]["input_tokens"],
                "completion_tokens": result["usage"]["output_tokens"],
                "cost": self._calculate_cost(
                    result["usage"]["input_tokens"],
                    result["usage"]["output_tokens"],
                    "claude",
                ),
            }
        except Exception as e:
            print(f"Claude failed: {e}, trying fallback...")

        # 2차: GPT-4o 폴백
        try:
            result = await self._generate_with_openai(prompt, max_tokens)
            return {
                "content": result["content"],
                "model": settings.FALLBACK_MODEL,
                "prompt_tokens": result["usage"]["prompt_tokens"],
                "completion_tokens": result["usage"]["completion_tokens"],
                "cost": self._calculate_cost(
                    result["usage"]["prompt_tokens"],
                    result["usage"]["completion_tokens"],
                    "openai",
                ),
            }
        except Exception as e:
            print(f"OpenAI failed: {e}, trying local model...")

        # 3차: 로컬 모델 (Ollama)
        result = await self._generate_with_ollama(prompt, max_tokens)
        return {
            "content": result["content"],
            "model": settings.LOCAL_MODEL,
            "prompt_tokens": result.get("prompt_eval_count", 0),
            "completion_tokens": result.get("eval_count", 0),
            "cost": 0.0,  # 로컬 모델은 무료
        }

    async def _generate_with_claude(self, prompt: str, max_tokens: int) -> dict:
        response = await self.anthropic.messages.create(
            model=settings.PRIMARY_MODEL,
            max_tokens=max_tokens,
            temperature=settings.TEMPERATURE,
            messages=[{"role": "user", "content": prompt}],
        )
        return {
            "content": response.content[0].text,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }

    async def _generate_with_openai(self, prompt: str, max_tokens: int) -> dict:
        response = await self.openai.chat.completions.create(
            model=settings.FALLBACK_MODEL,
            max_tokens=max_tokens,
            temperature=settings.TEMPERATURE,
            messages=[{"role": "user", "content": prompt}],
        )
        return {
            "content": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
            },
        }

    async def _generate_with_ollama(self, prompt: str, max_tokens: int) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.LOCAL_MODEL,
                    "prompt": prompt,
                    "options": {"num_predict": max_tokens, "temperature": settings.TEMPERATURE},
                    "stream": False,
                },
                timeout=120.0,
            )
            data = response.json()
            return {
                "content": data["response"],
                "prompt_eval_count": data.get("prompt_eval_count", 0),
                "eval_count": data.get("eval_count", 0),
            }

    def _calculate_cost(self, input_tokens: int, output_tokens: int, provider: str) -> float:
        """비용 계산 (USD)"""
        rates = {
            "claude": {"input": 3.0 / 1_000_000, "output": 15.0 / 1_000_000},
            "openai": {"input": 2.5 / 1_000_000, "output": 10.0 / 1_000_000},
        }
        rate = rates.get(provider, {"input": 0, "output": 0})
        return input_tokens * rate["input"] + output_tokens * rate["output"]
```

---

## 📡 API 라우터

```python
# app/routers/generation.py
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

router = APIRouter(tags=["generation"])

class GenerateRequest(BaseModel):
    job_id: str
    genre: str
    title: str
    synopsis: str
    previous_context: str | None = None
    episode_number: int = 1
    style: str = "default"
    max_tokens: int = Field(default=4000, le=8000)
    callback_url: str  # 완료 시 NestJS로 콜백

class GenerateResponse(BaseModel):
    job_id: str
    status: str  # "accepted"

@router.post("/generate", response_model=GenerateResponse)
async def generate_episode(
    request: Request,
    body: GenerateRequest,
    background_tasks: BackgroundTasks,
):
    """소설 에피소드 생성 요청 (비동기)"""
    generator = request.app.state.novel_generator

    # 백그라운드에서 생성
    background_tasks.add_task(
        _process_generation, generator, body
    )

    return GenerateResponse(job_id=body.job_id, status="accepted")

async def _process_generation(generator, body: GenerateRequest):
    """백그라운드 생성 처리"""
    import httpx

    try:
        result = await generator.generate_episode(
            genre=body.genre,
            title=body.title,
            synopsis=body.synopsis,
            previous_context=body.previous_context,
            episode_number=body.episode_number,
            style=body.style,
            max_tokens=body.max_tokens,
        )

        # NestJS로 결과 콜백
        async with httpx.AsyncClient() as client:
            await client.post(body.callback_url, json={
                "job_id": body.job_id,
                "status": "completed",
                "result": result,
            })

    except Exception as e:
        async with httpx.AsyncClient() as client:
            await client.post(body.callback_url, json={
                "job_id": body.job_id,
                "status": "failed",
                "error": str(e),
            })


class SynopsisRequest(BaseModel):
    genre: str
    keywords: list[str]
    style: str = "default"

@router.post("/synopsis")
async def generate_synopsis(request: Request, body: SynopsisRequest):
    """시놉시스 생성 (동기)"""
    generator = request.app.state.novel_generator
    # 시놉시스는 짧으므로 동기 처리
    result = await generator.generate_episode(
        genre=body.genre,
        title="",
        synopsis=", ".join(body.keywords),
        max_tokens=500,
    )
    return {"synopsis": result["content"], "model": result["model"]}
```

---

## 🔄 NestJS 연동 (BullMQ)

```typescript
// packages/backend/src/ai/ai.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';

@Processor('ai-generation')
export class AIGenerationProcessor extends WorkerHost {
  constructor(private readonly http: HttpService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { workId, episodeNumber, genre, title, synopsis, previousContext } = job.data;

    // FastAPI AI 서비스 호출
    await this.http.axiosRef.post(`${process.env.AI_SERVICE_URL}/api/v1/generate`, {
      job_id: job.id,
      genre,
      title,
      synopsis,
      previous_context: previousContext,
      episode_number: episodeNumber,
      callback_url: `${process.env.BACKEND_URL}/api/ai/callback`,
    });

    // 결과는 콜백으로 수신 (ai.controller.ts에서 처리)
  }
}
```

---

## 📊 생성 품질 관리

### 후처리 파이프라인

```python
async def post_process(content: str, genre: str) -> dict:
    """생성된 콘텐츠 후처리"""
    checks = {
        "word_count": len(content.split()),
        "has_prohibited_words": check_prohibited_words(content),
        "quality_score": await assess_quality(content),
        "genre_match": await check_genre_consistency(content, genre),
    }

    if checks["has_prohibited_words"]:
        content = remove_prohibited_words(content)

    if checks["quality_score"] < 0.6:
        # 품질 미달 시 재생성 요청
        return {"content": content, "needs_retry": True, **checks}

    return {"content": content, "needs_retry": False, **checks}

PROHIBITED_WORDS = [
    # 금칙어 목록 (비속어, 차별 표현 등)
]

def check_prohibited_words(content: str) -> bool:
    return any(word in content for word in PROHIBITED_WORDS)
```

---

*다음 문서: [prompt-engineering.md](./prompt-engineering.md) - 장르별 프롬프트*
