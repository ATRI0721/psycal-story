from typing import Optional, List
from fastapi import HTTPException
from sqlmodel import Session, select
from sqlalchemy.exc import SQLAlchemyError

from app.core.db import get_session
from app.core.security import get_password_hash
from app.models.database import (
    Conversation, Story, StoryMessage, User, Message
)
from app.models.interfaces import UserCreate
from app.utils import generate_uuid, get_time


# ===========================================================
#  User 相关
# ===========================================================

def add_user(user: UserCreate, session: Session) -> Optional[User]:
    if session.exec(select(User).where(User.email == user.email)).one_or_none():
        return None

    user_db = User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    session.add(user_db)
    session.flush()  # 获取 ID
    
    return user_db


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).one_or_none()


def get_user_by_id(id: str, session: Session) -> Optional[User]:
    return session.exec(select(User).where(User.id == id)).one_or_none()


def update_user_password(user: User, new_password: str, session: Session) -> User:
    user.hashed_password = get_password_hash(new_password)
    session.add(user)
    session.flush()
    return user


def delete_user(user: User, session: Session) -> None:
    session.delete(user)


def delete_storys(user: User, session: Session) -> None:
    # 获取用户的所有story进行删除
    for story in user.storys:
        session.delete(story)
    # 清空用户的故事列表，避免引用已删除的对象
    # 注意：这里不需要session.add(user)，因为user已经在会话中
    # 级联删除会自动处理关系的清理
    user.storys.clear()
    session.flush()


# ===========================================================
#  Story 相关
# ===========================================================

def add_story(user: User, story: Story, session: Session) -> Story:
    user.storys.append(story)
    session.add(user)
    session.add(story)
    session.flush()
    return story


def update_story(story: Story, session: Session) -> Story:
    story.updated_at = get_time()
    session.add(story)
    session.flush()
    return story


def update_story_title(story: Story, new_title: str, session: Session) -> Story:
    story.title = new_title
    story.updated_at = get_time()
    session.add(story)
    session.flush()
    return story


def delete_story(story: Story, session: Session) -> None:
    session.delete(story)


# ===========================================================
#  StoryMessage 相关
# ===========================================================

def add_story_message(story: Story, message: StoryMessage, session: Session) -> StoryMessage:
    story.story_messages.append(message)
    story.updated_at = get_time()
    session.add(story)
    session.add(message)
    session.flush()
    return message


def delete_story_message(story: Story, message: StoryMessage, session: Session) -> None:
    if message.story_id != story.id:
        raise HTTPException(status_code=400, detail="Message not in story")
    
    session.delete(message)
    story.updated_at = get_time()
    session.add(story)
    session.flush()


# ===========================================================
#  Conversation / Message 相关
# ===========================================================

def add_message(conversation: Conversation, message: Message, session: Session) -> Message:
    conversation.messages.append(message)
    session.add(conversation)
    session.add(message)
    session.flush()
    return message


def delete_message(message: Message, session: Session) -> None:
    session.delete(message)
    session.flush()


def get_conversation_messages(conversation_id: str, session: Session) -> List[Message]:
    return list(session.exec(
        select(Message).where(Message.conversation_id == conversation_id)
    ).all())
