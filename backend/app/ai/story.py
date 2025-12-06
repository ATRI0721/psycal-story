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
以下是社交平台中一些真实的发帖，可能与用户遇到的烦恼是相关的，从中选择一个最合适的作为故事原型，进行互动故事改编与续写,互动故事大概持续5轮进入到结局。
//
发帖:{related_post}
//
你要构建一个互动故事，让用户第一人称扮演这个角色。与真实故事不同的地方按逻辑续写。
每轮给用户设计3个选项，选项中应当具有积极和消极的。

一轮轮输出,每轮的输出格式严格按如下格式:
1.  首先，直接输出故事内容，可以使用段落、加粗等任何Markdown格式，但不要有"故事内容:"这样的前缀标签。
2.  空一行。
3.  接下来三行，每行是一个选项，必须使用Markdown链接格式：[选项X: 选项描述](action:choice-X)，其中X是1, 2, 3。

示例（一轮的输出）:
你走在一条幽暗的森林小径上，xxx

[选项一: xxx](action:choice-1)
[选项二: xxx](action:choice-2)
[选项三: xxx](action:choice-3)

结局的输出格式严格按照如下格式(这部分不需要是链接):
**真实结局:**xxx
**互动结局:**xxx
'''

prompts = {
    "system": system_prompt,
}

class StoryModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)
    
    async def generate_response(self, story: Story, story_message: StoryMessage, user_message: str):
        stream = await self.chat.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages = [{"role": "system", "content": self.prompts["system"].format(
                        situation=story.situation, problem_type=story.problem_type, related_post=story.related_post )},
                        *self.get_main_story(story, story_message),
                        {"role": "user", "content": user_message}],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content

storymodel = StoryModel() 