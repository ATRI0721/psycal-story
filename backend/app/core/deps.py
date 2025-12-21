from typing import Annotated, List
from sqlalchemy.orm import selectinload
from sqlmodel import select
    
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import get_session
from app.models.database import Conversation, Story, Message, StoryMessage, User, UserGroup


reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/vi/user/login/password")

SessionDep = Annotated[Session, Depends(get_session)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload['sub']
    except:
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

def require_group(allowed_groups: List[UserGroup]):
    def check_group(current_user: CurrentUser) -> User:
        if current_user.group not in allowed_groups:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required groups: {[g.value for g in allowed_groups]}"
            )
        return current_user
    return check_group

CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_group([UserGroup.ADMIN]))]
ExperimentUser = Annotated[User, Depends(require_group([UserGroup.EXPERIMENT, UserGroup.ADMIN]))]
ControlUser = Annotated[User, Depends(require_group([UserGroup.CONTROL, UserGroup.ADMIN]))]

def get_story(session: SessionDep, current_user: CurrentUser, story_id: str) -> Story:
    # stmt = select(Story).options(
    #         selectinload(Story.story_messages).selectinload(StoryMessage.conversation).selectinload(Conversation.messages) 
    #     ).where(Story.id == story_id)
        
    # story = session.exec(stmt).first()
    story = session.get(Story, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="story not found")
    if story.user != current_user:
        raise HTTPException(status_code=403, detail="Forbidden")
    return story

GetStory = Annotated[Story, Depends(get_story)]

def get_story_message(session: SessionDep, story: GetStory, message_id: str) -> StoryMessage:
    message = session.get(StoryMessage, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.story != story:
        raise HTTPException(status_code=403, detail="Forbidden")
    return message

GetMessage = Annotated[StoryMessage, Depends(get_story_message)]


