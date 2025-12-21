from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

from app.utils import generate_uuid, get_time

class UserGroup(str, Enum):
    CONTROL = "control"      # 对照组
    EXPERIMENT = "experiment" # 实验组
    ADMIN = "admin"           # 管理员


class User(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    email: str = Field(max_length=100, index=True, unique=True)
    hashed_password: str   
    created_at: datetime = Field(default_factory=get_time)
    
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    group: UserGroup = Field(default=UserGroup.CONTROL)

    storys: List["Story"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Story(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=get_time)
    updated_at: datetime = Field(default_factory=get_time)

    title: str = Field(max_length=100, default="新故事")
    problem_type: Optional[str] = None
    situation: Optional[str] = None
    related_post: Optional[str] = None

    user_id: str = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="storys")

    story_messages: List["StoryMessage"] = Relationship(
        back_populates="story",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class StoryMessage(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=get_time)

    stage: str = Field(default="inProgress")  # initial / inProgress / completed
    role: str = Field(default="user")  # user / assistant / system
    content: str
    order: int = Field(default=0)

    parent_id: Optional[str] = Field(default=None, foreign_key="storymessage.id")

    parent: Optional["StoryMessage"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "StoryMessage.id"}
    )

    children: List["StoryMessage"] = Relationship(
        back_populates="parent",
    )

    story_id: str = Field(foreign_key="story.id")
    story: Story = Relationship(back_populates="story_messages")

    conversation: "Conversation" = Relationship(
        back_populates="story_message",
        sa_relationship_kwargs={"uselist": False,
                                "cascade": "all, delete-orphan",
                                "passive_deletes": True},
    )


class Conversation(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)

    title: str = Field(max_length=100, default="新对话")

    story_message_id: str = Field(foreign_key="storymessage.id", unique=True)
    story_message: StoryMessage = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"uselist": False}
    )

    messages: List["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Message(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=get_time)

    role: str = Field(default="user")  # user / assistant / system
    content: str

    conversation_id: str = Field(foreign_key="conversation.id")
    conversation: Conversation = Relationship(back_populates="messages")