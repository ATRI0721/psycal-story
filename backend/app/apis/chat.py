from io import StringIO
import json
from typing import AsyncGenerator, List, Optional
from fastapi import APIRouter, Body, HTTPException, Path
from fastapi.responses import StreamingResponse
from app.ai.retriever import get_related_posts
from app.core.db import create_db_session, get_session
from app.core.deps import CurrentUser, GetStory, GetMessage, SessionDep
import app.curd as curd
from app.models.database import Conversation, Story, Message, StoryMessage
from app.models.interfaces import ChatConversation, ChatStory, ChatMessage, ChatStory, ChatStoryMessage, ChatStorywithoutMessages, ChatUpdateTitle
from app.ai.initmessages import ask_problems
from app.ai.story import storymodel
from app.ai.helper import helpermodel
from app.ai.topic import topicmodel
from app.utils import generate_uuid, get_time
from app.models.dto import StoryDTO, MessageDTO, ConversationDTO, UserDTO, orm_to_story_dto, orm_to_message_dto, orm_to_conversation_dto, orm_to_story_message_dto, orm_to_user_dto

router = APIRouter(tags=["chat"], prefix="/chat")

@router.get("/storys", response_model=List[ChatStorywithoutMessages])
def get_storys(user: CurrentUser):
    return user.storys

@router.post("/story", response_model=ChatStory)
def create_story(user: CurrentUser, session: SessionDep, title: Optional[str] = Body(None, embed=True)):
    story_db = Story(user_id=user.id)
    curd.add_story(user, story_db, session)
    initial_message = create_story_message(content="", role="system", stage="initial", story_id=story_db.id)
    initial_message.conversation.title = "信息收集"
    curd.add_story_message(story_db, initial_message, session)
    curd.add_message(initial_message.conversation, Message(content=ask_problems, role="assistant", conversation_id=initial_message.conversation.id), session)
    session.refresh(story_db)
    return get_chat_story(story_db)

@router.get("/story/{story_id}", response_model=ChatStory)
def get_story(story: GetStory):
    return get_chat_story(story)

@router.patch("/story/{story_id}", response_model=ChatStory)
def update_title(story: GetStory, title: ChatUpdateTitle, session: SessionDep):
    curd.update_story_title(story, title.title, session)
    return get_chat_story(story)

@router.delete("/story/{story_id}")
def delete_story(story: GetStory, session: SessionDep):
    curd.delete_story(story, session)
    return {"detail": "Story deleted"}

@router.delete("/storys")
def delete_storys(user: CurrentUser, session: SessionDep):
    curd.delete_storys(user, session)
    return {"detail": "All stories deleted"}


# @router.get("/completions/{story_id}/regenerate/{message_id}")
# async def regenerate_completions(story: GetStory, message: GetMessage, session: SessionDep):
#     curd.delete_messages(story, message, session)
#     ai_message = Message(content="", role="assistant")

#     async def respond():
#         yield format_event({
#             "type": "init",
#             "ai_message_id": ai_message.id,
#             "done": False,
#         })

#         async for content in scheduler.process_message(story, ai_message):
#             yield format_message(content, ai_message.id)

#         yield format_event({
#             "type": "message",
#             "value": "",
#             "done": True,
#             "id": ai_message.id
#         })

#     return StreamingResponse(respond(), media_type="text/event-stream")

@router.post("/completions/story/{story_id}/{message_id}")
async def get_story_completions(
    story: GetStory, 
    session: SessionDep,          
    message_content: str = Body(..., embed=True),
    message_id: str = Path(...)
):
    last_message = session.get(StoryMessage, message_id)
    if not last_message or last_message.story_id != story.id:
        raise HTTPException(status_code=404, detail="Message not found")
    if last_message.role == "user" or last_message.stage == "completed":
        raise HTTPException(status_code=400, detail="Cannot reply to this message")

    if last_message.stage == "initial":
        story.related_post = str(get_related_posts(story.situation))
    
    user_message = create_story_message(content=message_content, role="user", story_id=story.id, parent=last_message)
    ai_message = create_story_message(content="", role="assistant", story_id=story.id, parent=user_message)
    
    # 立即添加并刷新以获取ID
    session.add(user_message)
    session.add(ai_message)
    session.flush()  # 获取消息ID
    session.commit()
    last_message_dto = orm_to_story_message_dto(last_message)
    user_message_dto = orm_to_story_message_dto(user_message)
    ai_message_dto = orm_to_story_message_dto(ai_message)
    story_dto = orm_to_story_dto(story)
    session.close()

    async def respond() -> AsyncGenerator[str, None]:
        
        try:
            buffer = StringIO()
            async for content in generate_response(storymodel, story_dto, last_message_dto, user_message_dto, ai_message_dto, buffer):
                yield content
            final_content= buffer.getvalue()
            buffer.close()


            with create_db_session() as final_session:  # 注意：这里用的是新的session
                # 从数据库重新加载对象，确保状态最新
                ai_message_to_update: StoryMessage = final_session.get(StoryMessage, ai_message.id)
                story_to_update: Story = final_session.get(Story, story.id)

                ai_message_to_update.content = final_content
                if "真实结局" in final_content or "互动结局" in final_content:
                    ai_message_to_update.stage = "completed"
                
                story_to_update.updated_at = get_time()
                
                # 使用新session提交最终结果
                final_session.commit()

                yield format_event({
                "type": "message",
                "value": "",
                "done": True,
                "id": ai_message_to_update.id, 
                "stage": ai_message_to_update.stage
                })
            
        except Exception as e:
            yield format_event({
                "type": "error",
                "value": f"生成响应时出错: {e}",
                "done" : True,
            })

    return StreamingResponse(respond(), media_type="text/event-stream")


@router.post("/completions/conversation/{story_id}/{message_id}")
async def get_conversation_completions(
    story: GetStory, 
    session: SessionDep,          
    message_content: str = Body(..., embed=True),
    message_id: str = Path(...)
):
    last_message = session.get(StoryMessage, message_id)
    if not last_message or last_message.story_id != story.id:
        raise HTTPException(status_code=404, detail="Message not found")
    
    user_message = Message(content=message_content, role="user", conversation_id=last_message.conversation.id)
    ai_message = Message(content="", role="assistant", conversation_id=last_message.conversation.id)
    
    # 立即添加并刷新以获取ID
    session.add(user_message)
    session.add(ai_message)
    session.flush()  # 获取消息ID
    session.commit()
    last_message_dto = orm_to_story_message_dto(last_message)
    user_message_dto = orm_to_message_dto(user_message)
    ai_message_dto = orm_to_message_dto(ai_message)
    story_dto = orm_to_story_dto(story)
    session.close()

    async def respond() -> AsyncGenerator[str, None]:
        model = topicmodel if last_message.stage == "initial" else helpermodel

        try:
            buffer = StringIO()
            async for content in generate_response(model, story_dto, last_message_dto, user_message_dto, ai_message_dto, buffer):
                yield content
            final_content = buffer.getvalue()
            buffer.close()

            yield format_event({
                "type": "message",
                "value": "",
                "done": True,
                "id": ai_message.id
            })

            with create_db_session() as final_session: 
                ai_message_to_update: Message = final_session.get(Message, ai_message_dto.id)
                story_to_update: Story = final_session.get(Story, story_dto.id)
                story_to_update.situation = story_dto.situation
                story_to_update.problem_type = story_dto.problem_type
                story_to_update.updated_at = get_time()
                ai_message_to_update.content = final_content
                final_session.commit()
            
        except Exception as e:
            print(e)
            yield format_event({
                "type": "error",
                "value": f"生成响应时出错: {e}",
                "done" : True,
            })

    return StreamingResponse(respond(), media_type="text/event-stream")


async def generate_response(model, story, last_message, user_message, ai_message, buffer: StringIO) -> AsyncGenerator[str, None]:
    yield format_event({
        "type": "init",
        "user_message_id": user_message.id, 
        "ai_message_id": ai_message.id,
        "done": False,
    })
    async for content in model.generate_response(story, last_message, user_message.content):
        buffer.write(content)
        yield format_event({
            "type": "message",
            "value": content,
            "done": False,
            "id": ai_message.id
        }) 


def format_event(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False) + "\n\n\n"

def get_chat_story(story: Story) -> ChatStory:
    # 创建基础数据字典，确保包含所有必需字段
    base_data = story.model_dump(exclude={"story_type", "story_topic", "user", "story_messages"})
    
    # 确保 title 字段存在（使用默认值如果为 None）
    if base_data.get("title") is None:
        base_data["title"] = "新故事"
    
    # 处理 story_messages
    story_messages_data = []
    for m in story.story_messages:
        message_data = m.model_dump(exclude={"children", "parent"})
        message_data["children_id"] = [child.id for child in m.children]
        
        # 转换 conversation 为 ChatConversation
        if m.conversation:
            conversation_data = {
                "title": m.conversation.title,
                "messages": [
                    {
                        "id": msg.id,
                        "content": msg.content,
                        "role": msg.role
                    }
                    for msg in m.conversation.messages
                ]
            }
            message_data["conversation"] = conversation_data
        
        story_messages_data.append(message_data)
    
    # 更新基础数据并创建 ChatStory 对象
    base_data["story_messages"] = story_messages_data
    return ChatStory.model_validate(base_data)

def create_story_message(**data) -> StoryMessage:
    story_message = StoryMessage(
        **data,
        id=generate_uuid(),
    )
    
    story_message.conversation = Conversation(
        story_message_id=story_message.id
    )
    
    return story_message