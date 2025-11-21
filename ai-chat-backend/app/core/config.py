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

    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:latest"

    CHAT_MODEL: str = "deepseek-reasoner"
    CHAT_MODEL_URL: str = "https://api.deepseek.com"

    RESTATE_MODEL: str = "deepseek-chat"
    RESTATE_MODEL_URL: str = "https://api.deepseek.com"

    EMBEND_MODEL: str = "znbang/bge:large-en-v1.5-f16"
    EMBEND_MODEL_URL: str = "http://localhost:11434"
    PERSIST_DIR: str = "/data/vector_QAFamily_db"

    TITLE_MODEL: str = "deepseek-chat"
    TITLE_MODEL_URL: str = "https://api.deepseek.com"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # ------------------ 必填项（必须传入环境变量） ------------------
    SECRET_KEY: str = Field(..., description="JWT secret key")
    EMAIL_USERNAME: str = Field(..., description="SMTP email username")
    EMAIL_PASSWORD: str = Field(..., description="SMTP email password")
    MODEL_API_KEY: str = Field(..., description="Model API key")

    # ------------------ 配置 ------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
