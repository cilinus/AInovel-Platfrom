from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8000
    env: str = "development"

    # Anthropic
    anthropic_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Ollama
    ollama_base_url: str = "http://localhost:11434"

    # Backend
    backend_url: str = "http://localhost:3001"
    backend_webhook_secret: str = ""

    # Limits
    max_daily_generations: int = 1000
    max_concurrent: int = 5

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
