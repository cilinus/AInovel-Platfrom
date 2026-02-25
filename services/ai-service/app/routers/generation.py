from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(tags=["generation"])


class GenerateRequest(BaseModel):
    work_id: str
    genre: str
    prompt: str
    previous_context: str | None = None
    model_tier: str = "standard"  # premium, standard, local


class GenerateResponse(BaseModel):
    content: str
    model_used: str
    prompt_tokens: int
    completion_tokens: int
    generation_time: float


@router.post("/generate", response_model=GenerateResponse)
async def generate_episode(request: Request, body: GenerateRequest):
    client = request.app.state.anthropic_client

    system_prompt = (
        "당신은 한국 웹소설 전문 작가입니다. "
        "독자를 몰입시키는 매력적인 한국어 웹소설을 작성합니다. "
        f"장르: {body.genre}"
    )

    user_prompt = body.prompt
    if body.previous_context:
        user_prompt = f"이전 내용:\n{body.previous_context}\n\n---\n\n{user_prompt}"

    import time

    start = time.time()

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    elapsed = time.time() - start

    return GenerateResponse(
        content=message.content[0].text,
        model_used=message.model,
        prompt_tokens=message.usage.input_tokens,
        completion_tokens=message.usage.output_tokens,
        generation_time=round(elapsed, 2),
    )
