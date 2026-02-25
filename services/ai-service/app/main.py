from contextlib import asynccontextmanager

import anthropic
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import generation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize clients
    app.state.anthropic_client = anthropic.AsyncAnthropic(
        api_key=settings.anthropic_api_key,
    )
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    yield
    # Shutdown: cleanup
    await app.state.http_client.aclose()


app = FastAPI(
    title="AI Novel Generation Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generation.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
