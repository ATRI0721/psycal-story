from datetime import datetime
from typing import List
from sqlmodel import Field, Relationship, SQLModel

from app.utils import generate_uuid, get_time


class User(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    email: str = Field(max_length=100, index=True, unique=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_time)
    last_login: datetime | None = None

    conversations: List["Conversation"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Conversation(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=get_time)
    updated_at: datetime = Field(default_factory=get_time)

    stage: str = Field(default="initial")  # initial / topic / story / evaluation
    title: str = Field(max_length=100, default="新对话")
    story_topic: str | None = None
    story_type: str | None = None

    user_id: str = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="conversations")
    messages: List["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Message(SQLModel, table=True):
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=get_time)

    stage: str = Field(default="initial")  # initial / topic / story / evaluation
    role: str = Field(default="user") # user / assistant / system
    content: str

    conversation_id: str = Field(foreign_key="conversation.id")
    conversation : Conversation = Relationship(back_populates="messages")
