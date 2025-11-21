from openai import AsyncOpenAI

from app.ai.basemodel import BaseModel
from app.models.database import Conversation, Message

chat = AsyncOpenAI (
    base_url='https://api.openai-proxy.org/v1',
    api_key='sk-U7B0hD9SXkutlHX0SIziO3hNG03i4L8XR9KTWrpyCizamEks',
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
<user>用户选择的烦恼类型:学业问题,家庭问题,师生关系</user>
<assistant>听起来学业、家庭、老师这几方面一起压着你，真的会很累、很烦。你愿意说出来已经很勇敢了，先别责怪自己，我们可以一步一步来。

[情境一: 学业：成绩突然下滑，作业和考试堆一起，越紧张越学不进去，晚上还睡不好。](action:scenario-1)
[情境二: 家庭：父母总拿你和别人比，盯成绩很严，一沟通就吵，你觉得他们不懂你的努力。](action:scenario-2)
[情境三: 师生关系：觉得老师对你不太公平，课堂当众点名或批评，你开始害怕发言、不敢交流。](action:scenario-3)
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
    
    async def generate_response(self, conversation: Conversation):
        user_input = conversation.messages[-1].content
        user_input = f"{self.prompts['problem']}{user_input}"
        stream = await self.chat.chat.completions.create(
            model='gpt-5',
            messages = [{"role": "system", "content": self.prompts["system"]},
                        {"role": "user", "content": user_input}],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content


