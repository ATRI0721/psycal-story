from openai import AsyncOpenAI, AsyncStream

from app.models.database import Conversation, Message
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

    def get_messages(self, conversation: Conversation, from_index: int = 0):
        messages = [{"role": msg.role, "content": msg.content} for msg in conversation.messages[from_index:]]
        return self._to_openai_message(messages)
    
    def get_specific_messages(self, conversation: Conversation, stage: str):
        messages = [{"role": msg.role, "content": msg.content} for msg in conversation.messages if msg.stage == stage]
        return self._to_openai_message(messages)

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

    async def generate_response(self, conversation: Conversation):
        raise NotImplementedError("Subclasses must implement this method.")