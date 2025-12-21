from app.models.dto import StoryDTO, StoryMessageDTO
from openai import AsyncOpenAI
from app.core.config import settings
from app.ai.basemodel import BaseModel
from app.models.database import Conversation, Story, StoryMessage

chat = AsyncOpenAI (
    base_url=settings.CHAT_MODEL_URL,
    api_key=settings.MODEL_API_KEY,
)

system_prompt='''
用户的烦恼类型是:{problem_type}，具体的情境是:{situation}
以下是社交平台中一些真实的发帖，可能与用户遇到的烦恼是相关的，从中选择一个最合适的作为故事原型，进行故事改编与续写。
//
发帖:{related_post}
//
你要构建一个故事，让用户第一人称扮演这个角色。与真实故事不同的地方按逻辑续写。

一次性输出故事，每个故事大概4-5段。
示例（一轮的输出）:
你走在一条幽暗的森林小径上，xxx

结局部分的输出格式严格按照如下格式(这部分不需要是链接):
**真实结局:**xxx
**互动结局:**xxx
**故事分析:**xxx(结合1-2个用户做出的选择进行具有启发的分析)
'''

prompts = {
    "system": system_prompt,
}

class ControlModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)
    
    async def generate_response(self, story: StoryDTO, story_message: StoryMessageDTO, user_message: str):
        stream = await self.chat.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages = [{"role": "system", "content": self.prompts["system"].format(
                        situation=story.situation, problem_type=story.problem_type, related_post=story.related_post )},
                        {"role": "user", "content": user_message}],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content

controlmodel = ControlModel() 