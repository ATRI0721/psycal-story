from openai import AsyncOpenAI

from app.ai.basemodel import BaseModel
from app.models.database import Conversation


chat = AsyncOpenAI (
    base_url='https://api.openai-proxy.org/v1',
    api_key='sk-U7B0hD9SXkutlHX0SIziO3hNG03i4L8XR9KTWrpyCizamEks',
)
system_prompt='''
            你是一个具有帮助功能的心理咨询师，用户完成了一段与其烦恼相似的互动故事。
            从中选取提炼出一个用户做出的消极选择或思维陷阱，之后用苏格拉底式提问法引导用户反思这些选择背后的认知偏差，并帮助用户发现更积极的应对策略，每次最多只问一个问题。
            当你觉得提问已经进行的差不多了就给出简短总结和鼓励。
            用户的烦恼：{storytopic}
        '''

prompts = {
    "system": system_prompt,
}

class EvaluationModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)
    
    async def generate_response(self, conversation: Conversation):
        stream = await self.chat.chat.completions.create(
            model='gpt-5',
            messages = [{"role": "system", "content": self.prompts["system"].format(storytopic=conversation.story_topic)},
                        *self.get_messages(conversation, 6)],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content
