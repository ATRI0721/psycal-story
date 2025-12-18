from app.models.dto import ConversationDTO, StoryDTO, StoryMessageDTO
from openai import AsyncOpenAI
from app.ai.initmessages import start_story
from app.ai.basemodel import BaseModel
from app.models.database import Conversation, Message, Story, StoryMessage
from app.core.config import settings

chat = AsyncOpenAI (
    base_url=settings.CHAT_MODEL_URL,
    api_key=settings.MODEL_API_KEY,
)

system_prompt = \
'''
这是一名青少年和一个专业的心理咨询师的咨询记录:
{history}
你的任务是为这段记录提供一个简短的标题,要求如下:
1. 严格只输出中文标题,不得包括数字,字母及标点符号
2. 字数控制在5-10个字之间
'''

prompts = {
    "system": system_prompt
}

class TitleModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)
    
    async def generate_response(self, story: StoryDTO):
        h1 = self.to_openai_message(story.story_messages[0].conversation.messages)
        h2 = self.to_openai_message(story.story_messages[1:])
        stream = await self.chat.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages = [{"role": "system", "content": self.prompts["system"].format(history=h1+h2)}],
            stream=True,
        )
        async for content in self._stream_response_content(stream):
            yield content
        

titlemodel = TitleModel()
