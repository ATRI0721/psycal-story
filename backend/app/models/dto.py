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

    @classmethod
    def from_orm(cls, m: Message) -> "MessageDTO":
        return cls(
            id=m.id,
            created_at=m.created_at,
            role=m.role,
            content=m.content,
        )



class ConversationDTO(SQLModel):
    id: str
    title: str
    messages: List[MessageDTO] = []

    @classmethod
    def from_orm(cls, c: Conversation) -> "ConversationDTO":
        return cls(
            id=c.id,
            title=c.title,
            messages=[MessageDTO.from_orm(m) for m in c.messages]
        )


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

    @classmethod
    def from_orm(cls, sm: StoryMessage) -> "StoryMessageDTO":
        dto = cls(
            id=sm.id,
            created_at=sm.created_at,
            stage=sm.stage,
            role=sm.role,
            content=sm.content,
            order=sm.order,
            parent_id=sm.parent_id,
            conversation=ConversationDTO.from_orm(sm.conversation),
        )

        dto.children = [
            StoryMessageDTO.from_orm(child)
            for child in sm.children
        ]

        return dto


class StoryDTO(SQLModel):
    id: str
    created_at: datetime
    updated_at: datetime

    title: str
    problem_type: Optional[str]
    situation: Optional[str]
    related_post: Optional[str]

    story_messages: List[StoryMessageDTO] = []

    @classmethod
    def from_orm(cls, story: Story) -> "StoryDTO":
        return cls(
            id=story.id,
            created_at=story.created_at,
            updated_at=story.updated_at,

            title=story.title,
            problem_type=story.problem_type,
            situation=story.situation,
            related_post=story.related_post,

            story_messages=[
                StoryMessageDTO.from_orm(sm)
                for sm in story.story_messages
            ]
        )


class UserDTO(SQLModel):
    id: str
    email: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    storys: List[StoryDTO] = []

    @classmethod
    def from_orm(cls, u: User) -> "UserDTO":
        return cls(
            id=u.id,
            email=u.email,
            is_active=u.is_active,
            created_at=u.created_at,
            last_login=u.last_login,
            storys=[StoryDTO.from_orm(s) for s in u.storys]
        )
