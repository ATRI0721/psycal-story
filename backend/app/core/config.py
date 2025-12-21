from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # ------------------ 可选项 ------------------
    API_V1_STR: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite:///../data/app.db"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3 * 24 * 60  # 3 days

    # ------------------ 必填项（必须传入环境变量） ------------------
    SECRET_KEY: str = Field(..., description="JWT secret key")
    
    EMBEDDER_MODEL: str = Field(..., description="Embedder model path")
    RERANK_MODEL: str = Field(..., description="Rerank model path")

    CHAT_MODEL: str = Field(..., description="Chat model path")
    CHAT_MODEL_URL: str = Field(..., description="Chat model url")
    MODEL_API_KEY: str = Field(..., description="Model API key")

    # ------------------ 配置 ------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
