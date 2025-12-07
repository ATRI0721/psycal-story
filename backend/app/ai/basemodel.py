from app.models.dto import StoryDTO, StoryMessageDTO
from openai import AsyncOpenAI, AsyncStream

from app.models.database import Conversation, Message, Story, StoryMessage
from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam



class BaseModel:
    def __init__(self, prompts:dict, chatmodel:AsyncOpenAI) -> None:
        self.prompts = prompts
        self.chat = chatmodel

    async def _stream_response_content(self, stream:AsyncStream):
        async for chunk in stream:
            content = None
            if not chunk.choices:
                continue
            if hasattr(chunk.choices[0], "delta") and getattr(chunk.choices[0].delta, "content", None) is not None:
                content = chunk.choices[0].delta.content
            elif hasattr(chunk.choices[0], "message") and getattr(chunk.choices[0].message, "content", None) is not None:
                content = chunk.choices[0].message.content
            if content:
                yield content

    def get_main_story(self, story: StoryDTO, story_message: StoryMessageDTO):
        r = []
        m = { msg.id: msg for msg in story.story_messages }
        s = story_message
        while(s and s.parent_id):            
            r.insert(0, {
                "role": s.role,
                "content": s.content
            })
            s = m.get(s.parent_id)
        return self._to_openai_message(r)

    def _to_openai_message(self, message: list[dict[str,str]]):
        openai_messages = []
        for msg in message:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                openai_messages.append(ChatCompletionUserMessageParam(role="user", content=content))
            elif role == "assistant":
                openai_messages.append(ChatCompletionAssistantMessageParam(role="assistant", content=content))
            elif role == "system":
                openai_messages.append(ChatCompletionSystemMessageParam(role="system", content=content))
        return openai_messages

    async def generate_response(self):
        raise NotImplementedError("Subclasses must implement this method.")