from typing import Annotated
from sqlalchemy.orm import selectinload
from sqlmodel import select
    
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import get_session
from app.models.database import Conversation, Message, User


reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/vi/user/login/password")

SessionDep = Annotated[Session, Depends(get_session)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload['sub']
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

def get_conversation(session: SessionDep, current_user: CurrentUser, conversation_id: str) -> Conversation:
    stmt = select(Conversation).options(
            selectinload(Conversation.messages) 
        ).where(Conversation.id == conversation_id)
        
    conversation = session.exec(stmt).first()
    # conversation = session.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    return conversation

GetConversation = Annotated[Conversation, Depends(get_conversation)]

def get_message(session: SessionDep, current_user: CurrentUser, conversation: GetConversation, message_id: str) -> Message:
    message = session.get(Message, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.conversation != conversation:
        raise HTTPException(status_code=403, detail="Forbidden")
    return message

GetMessage = Annotated[Message, Depends(get_message)]


