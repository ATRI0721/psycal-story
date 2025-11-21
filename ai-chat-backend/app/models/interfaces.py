from datetime import datetime
from sqlmodel import Field, SQLModel

# --- 用户相关 ---
class UserCreate(SQLModel):
    email: str
    password: str
    verification_code: str

class UserLoginPassword(SQLModel):
    email: str
    password: str

class UserLoginCode(SQLModel):
    email: str
    verification_code: str

class UserResetPassword(SQLModel):
    email: str
    verification_code: str
    new_password: str

class UserLoginResponse(SQLModel):
    id: str
    email: str

class UserResponse(SQLModel):
    access_token: str
    user: UserLoginResponse


# --- 邮件验证相关 ---
class AuthEmail(SQLModel):
    email: str

class AuthEmailVerification(SQLModel):
    email: str
    verification_code: str


# --- 聊天相关 ---
class ChatMessage(SQLModel):
    id: str
    content: str
    role: str
    stage: str 
    conversation_id: str
    created_at: datetime

class ChatConversation(SQLModel):
    id: str
    title: str
    updated_at: datetime

class ChatCreate(SQLModel):
    title: str = Field(default="新对话")
    

class ChatUpdate(SQLModel):
    title: str


# --- Token ---
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: str | None = None
    role: str = "user"
