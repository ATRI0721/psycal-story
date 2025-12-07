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

system_prompt = '''
用户是一名青少年,你是一个专业的心理咨询师。
要求1.请你就用户的问题给出简短地共情与安慰。
要求2.请你简洁地举3个不同的场景来细化这一问题类型供用户选择。
输出严格按照如下形式:
1.  第一行是共情与安慰的纯文本。
2.  空一行。
3.  接下来三行，每行是一个选项，必须使用Markdown链接格式：[情境X: 场景描述](action:scenario-X)，其中X是1, 2, 3。

示例:
<user>用户选择的烦恼类型:xxx</user>
<assistant>xxx，我们可以一步一步来。

[情境一: xxx](action:scenario-1)
[情境二: xxx](action:scenario-2)
[情境三: xxx](action:scenario-3)
</assistant>
语言风格要贴近中学生。
'''

# 用户烦恼提示词
problem_prompst = "用户选择的烦恼类型:"

prompts = {
    "system": system_prompt,
    "problem": problem_prompst
}

class TopicModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)

    async def generate_ai_response(self, conversation: ConversationDTO):
        user_input = conversation.messages[-1].content
        user_input = f"{self.prompts['problem']}{user_input}"
        stream = await self.chat.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages = [{"role": "system", "content": self.prompts["system"]},
                        {"role": "user", "content": user_input}],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content
    
    async def generate_response(self, story: StoryDTO, story_message: StoryMessageDTO, user_message: str):
        if len(story_message.conversation.messages) == 5:
            story.situation = user_message
            story.problem_type = story_message.conversation.messages[1].content
            yield start_story
        else:
            async for response in self.generate_ai_response(story_message.conversation):
                yield response
        

topicmodel = TopicModel()
