from typing import Optional
from fastapi import HTTPException
from sqlmodel import Session, select
from sqlalchemy.exc import SQLAlchemyError
from app.core.db import get_session
from app.core.security import get_password_hash
from app.models.database import User, Conversation, Message
from app.models.interfaces import UserCreate
from app.utils import get_time


# ========== 通用事务装饰器 ==========
def transactional(refresh: bool = True, add: bool = True):
    """
    简单事务装饰器
    - 自动 add / commit / rollback
    - refresh 控制是否刷新对象
    - add=False 适合 delete
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            session: Optional[Session] = kwargs.get("session") or (
                next((a for a in args if isinstance(a, Session)), None)
            )
            if session is None:
                session = next(get_session())
            if session is None:
                raise RuntimeError("Session is required")

            try:
                instance = func(*args, **kwargs)
                if instance is not None and add:
                    session.add(instance)
                session.commit()
                if refresh and instance is not None:
                    session.refresh(instance)
                return instance
            except SQLAlchemyError as e:
                session.rollback()
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        return wrapper
    return decorator


# ========== 用户相关 ==========
@transactional()
def add_user(user: UserCreate, session: Session) -> Optional[User]:
    if session.exec(select(User).where(User.email == user.email)).one_or_none():
        return None
    return User(email=user.email, hashed_password=get_password_hash(user.password))


def get_user_by_email(email: str, session: Session) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).one_or_none()


def get_user_by_id(id: str, session: Session) -> Optional[User]:
    return session.exec(select(User).where(User.id == id)).one_or_none()


@transactional()
def update_user_password(user: User, new_password: str, session: Session) -> User:
    user.hashed_password = get_password_hash(new_password)
    return user


@transactional(add=False, refresh=False)
def delete_user(user: User, session: Session) -> None:
    session.delete(user)
    return None


# ========== 会话相关 ==========
@transactional()
def add_conversation(user: User, conversation: Conversation, session: Session) -> Conversation:
    user.conversations.append(conversation)
    return conversation

@transactional()
def update_conversation(conversation: Conversation, session: Optional[Session] = None) -> Conversation:
    conversation.updated_at = get_time()
    return conversation


@transactional()
def update_conversation_title(conversation: Conversation, new_title: str, session: Optional[Session] = None) -> Conversation:
    conversation.title = new_title
    conversation.updated_at = get_time()
    return conversation


@transactional(add=False, refresh=False)
def delete_conversation(conversation: Conversation, session: Session) -> None:
    session.delete(conversation)
    return None


# ========== 消息相关 ==========
@transactional()
def add_message(conversation: Conversation, message: Message, session: Session) -> Message:
    conversation.messages.append(message)
    conversation.updated_at = get_time()
    return message


@transactional(add=False, refresh=False)
def delete_message(message: Message, session: Session) -> None:
    session.delete(message)
    return None


@transactional()
def delete_messages(conversation: Conversation, message: Message, session: Session) -> Conversation:
    if message.conversation_id != conversation.id:
        raise HTTPException(status_code=400, detail="Message not in conversation")

    pos = conversation.messages.index(message)
    conversation.messages = conversation.messages[:pos]
    conversation.updated_at = get_time()
    return conversation
