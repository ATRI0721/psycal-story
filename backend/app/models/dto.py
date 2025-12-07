from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel

from app.models.database import (
    User, Story, StoryMessage, Conversation, Message
)


# ===========================
# 基础 DTO（纯 Pydantic 模型）
# ===========================

class MessageDTO(SQLModel):
    id: str
    created_at: datetime
    role: str
    content: str


class ConversationDTO(SQLModel):
    id: str
    title: str
    messages: List[MessageDTO] = []


class StoryMessageDTO(SQLModel):
    id: str
    created_at: datetime
    stage: str
    role: str
    content: str
    order: int
    parent_id: Optional[str]

    children: List["StoryMessageDTO"] = []
    conversation: ConversationDTO


class StoryDTO(SQLModel):
    id: str
    created_at: datetime
    updated_at: datetime

    title: str
    problem_type: Optional[str]
    situation: Optional[str]
    related_post: Optional[str]

    story_messages: List[StoryMessageDTO] = []


class UserDTO(SQLModel):
    id: str
    email: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    storys: List[StoryDTO] = []


# ===========================================
# ORM → DTO 转换函数（不会触发 lazy load）
# ===========================================

def orm_to_message_dto(m: Message) -> MessageDTO:
    return MessageDTO(
        id=m.id,
        created_at=m.created_at,
        role=m.role,
        content=m.content,
    )


def orm_to_conversation_dto(c: Conversation) -> ConversationDTO:
    return ConversationDTO(
        id=c.id,
        title=c.title,
        messages=[orm_to_message_dto(m) for m in c.messages]
    )


def orm_to_story_message_dto(sm: StoryMessage) -> StoryMessageDTO:

    dto = StoryMessageDTO(
        id=sm.id,
        created_at=sm.created_at,
        stage=sm.stage,
        role=sm.role,
        content=sm.content,
        order=sm.order,
        parent_id=sm.parent_id,
        conversation=orm_to_conversation_dto(sm.conversation),
    )

    # 子节点（如果你用 selectinload，会自动预加载）
    dto.children = [
        orm_to_story_message_dto(child)
        for child in sm.children
    ]

    # 对话（有可能为空）
    if sm.conversation:
        dto.conversation = orm_to_conversation_dto(sm.conversation)

    return dto


def orm_to_story_dto(story: Story) -> StoryDTO:
    return StoryDTO(
        id=story.id,
        created_at=story.created_at,
        updated_at=story.updated_at,

        title=story.title,
        problem_type=story.problem_type,
        situation=story.situation,
        related_post=story.related_post,

        story_messages=[
            orm_to_story_message_dto(sm)
            for sm in story.story_messages
        ]
    )


def orm_to_user_dto(u: User) -> UserDTO:
    return UserDTO(
        id=u.id,
        email=u.email,
        is_active=u.is_active,
        created_at=u.created_at,
        last_login=u.last_login,
        storys=[orm_to_story_dto(s) for s in u.storys]
    )
