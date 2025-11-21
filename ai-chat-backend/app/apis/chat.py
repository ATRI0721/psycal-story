from io import StringIO
import json
from typing import AsyncGenerator, List, Optional
from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import StreamingResponse
# from app.ai.llm import generate_ai_response, generate_title as ai_generate_title
from app.core.db import get_session
from app.core.deps import CurrentUser, GetConversation, GetMessage, SessionDep
import app.curd as curd
from app.models.database import Conversation, Message
from app.models.interfaces import ChatConversation, ChatCreate, ChatMessage, ChatUpdate
from app.ai.initmessages import ask_story_type
from app.ai.scheduler import scheduler
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

router = APIRouter(tags=["chat"], prefix="/chat")

@router.get("/conversations", response_model=List[ChatConversation])
def get_conversations(user: CurrentUser):
    return user.conversations

@router.post("/conversation", response_model=ChatConversation)
def create_conversation(user: CurrentUser, conversation: ChatCreate, session: SessionDep):
    conversation_db = Conversation(title=conversation.title, user_id=user.id)
    curd.add_conversation(user, conversation_db, session)
    initial_message = Message(content=ask_story_type, role="assistant", conversation_id=conversation_db.id)
    curd.add_message(conversation_db, initial_message, session)
    return conversation_db

@router.get("/conversation/{conversation_id}/messages", response_model=List[ChatMessage])
def get_messages(conversation: GetConversation):
    return conversation.messages

@router.patch("/conversation/{conversation_id}", response_model=ChatConversation)
def update_title(conversation: GetConversation, title: ChatUpdate, session: SessionDep):
    curd.update_conversation_title(conversation, title.title, session)
    return conversation

# @router.get("/conversation/{conversation_id}/generate-title", response_model=ChatConversation)
# def generate_title(conversation: GetConversation):
#     _messages = [{"role": msg.role, "content": msg.content} for msg in conversation.messages]
#     async def _generate_title():
#         _title = ""
#         async for t in ai_generate_title(_messages):
#             t.update({
#                 "type": "title",
#                 "conversation_id": conversation.id,
#                 "done" : False,
#             })
#             _title += t["value"]         
#             yield format_event(t)
#         update_conversation_title(conversation, _title)
#         yield format_event({
#             "type": "title",
#             "conversation_id": conversation.id,
#             "value": _title,
#             "update_time": conversation.updated_at.isoformat(),
#             "done" : True,
#         })
#     return StreamingResponse(_generate_title(), media_type="text/event-stream")

@router.delete("/conversation/{conversation_id}")
def delete_conversation(conversation: GetConversation, session: SessionDep):
    curd.delete_conversation(conversation, session)
    return {"message": "success"}

@router.delete("/conversations")
def delete_conversations(user: CurrentUser, session: SessionDep):
    for conversation in user.conversations:
        curd.delete_conversation(conversation, session)
    return {"message": "success"}

@router.get("/completions/{conversation_id}/regenerate/{message_id}")
async def regenerate_completions(conversation: GetConversation, message: GetMessage, session: SessionDep):
    curd.delete_messages(conversation, message, session)
    ai_message = Message(content="", role="assistant")

    async def respond():
        yield format_event({
            "type": "init",
            "ai_message_id": ai_message.id,
            "done": False,
        })

        async for content in scheduler.process_message(conversation, ai_message):
            yield format_message(content, ai_message.id)

        yield format_event({
            "type": "message",
            "value": "",
            "done": True,
            "id": ai_message.id
        })

    return StreamingResponse(respond(), media_type="text/event-stream")

@router.post("/completions/{conversation_id}")
async def get_completions(
    conversation: GetConversation, 
    session: SessionDep,          
    message: str = Body(..., embed=True),
):
    user_message = Message(content=message, role="user", conversation_id=conversation.id)
    ai_message = Message(content="", role="assistant", conversation_id=conversation.id)
    conversation.messages.append(user_message)

    async def respond() -> AsyncGenerator[str, None]:
        yield format_event({
            "type": "init",
            "user_message_id": user_message.id, 
            "ai_message_id": ai_message.id,
            "done": False,
        })

        try:
            async for content in scheduler.process_message(conversation, ai_message):
                yield format_message(content, ai_message.id) 
            
            session.add(user_message)
            session.add(ai_message)
            session.add(conversation)
            session.commit()
            
            yield format_event({
                "type": "message",
                "value": "",
                "done": True,
                "id": str(ai_message.id) 
            })
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    return StreamingResponse(respond(), media_type="text/event-stream")


def format_message(content: str, id: str) -> str:
    return format_event({
        "type": "message",
        "value": content,
        "done": False,
        "id": id
    })

def format_event(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False) + "\n\n\n"
