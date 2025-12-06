from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # ------------------ 可选项 ------------------
    API_V1_STR: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite:///data/ai_chat.db"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3 * 24 * 60  # 3 days

    EMAIL_SMTP_SERVER: str = "smtp.qq.com"
    EMAIL_PORT: int = 465
    EMAIL_VALIDATE_TOKEN_EXPIRE_MINUTES: int = 10 * 60  # 10 minutes

    CHAT_MODEL: str = "deepseek-chat"
    CHAT_MODEL_URL: str = "https://api.deepseek.com"

    RESTATE_MODEL: str = "deepseek-chat"
    RESTATE_MODEL_URL: str = "https://api.deepseek.com"

    EMBEND_MODEL: str = "znbang/bge:large-en-v1.5-f16"

    EMBEDDER_MODEL: str = "C:\\Users\\Chtholly\\.cache\\huggingface\\hub\\models--BAAI--bge-large-zh\\snapshots\\b5d9f5c027e87b6f0b6fa4b614f8f9cdc45ce0e8"
    RERANK_MODEL: str = "C:\\Users\\Chtholly\\.cache\\huggingface\\hub\\models--BAAI--bge-reranker-v2-m3\\snapshots\\953dc6f6f85a1b2dbfca4c34a2796e7dde08d41e"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # ------------------ 必填项（必须传入环境变量） ------------------
    SECRET_KEY: str = Field(..., description="JWT secret key")
    MODEL_API_KEY: str = Field(..., description="Model API key")

    # ------------------ 配置 ------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
