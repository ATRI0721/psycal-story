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

class ChatConversation(SQLModel):
    title: str
    messages: list[ChatMessage]

class ChatStoryMessage(SQLModel):
    id: str

    content: str
    role: str
    stage: str

    story_id: str
    parent_id: str | None
    conversation: ChatConversation
    children_id: list[str] = Field(default_factory=list)
    

class ChatStorywithoutMessages(SQLModel):
    id: str
    title: str

    created_at: datetime
    updated_at: datetime

class ChatStory(SQLModel):
    id: str
    created_at: datetime
    updated_at: datetime

    title: str
    story_messages: list[ChatStoryMessage]
    

class ChatUpdateTitle(SQLModel):
    title: str


# --- Token ---
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: str | None = None
    role: str = "user"
