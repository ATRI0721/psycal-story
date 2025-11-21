from openai import AsyncOpenAI

from app.ai.basemodel import BaseModel
from app.models.database import Conversation

chat = AsyncOpenAI (
    base_url='https://api.openai-proxy.org/v1',
    api_key='sk-U7B0hD9SXkutlHX0SIziO3hNG03i4L8XR9KTWrpyCizamEks',
)

system_prompt='''
用户的烦恼：{storytopic}
用户喜欢的故事类型：{storytype}
你的目的是基于用户的烦恼，从用户喜欢的故事类型中寻找一个相似情境的故事。
你要构建一个互动故事，让用户第一人称扮演这个角色。故事持续5轮左右，每轮大概500字左右，故事不要做太多改编，与真实故事不同的地方按逻辑续写。
故事应具有充分的细节，把握好故事节奏。每轮给用户设计3个选项，其中有一两个选项是思维陷阱，结局按照选择决定好坏。
在故事中先不要出现角色的信息，在结局之后告诉用户真实故事是什么、与互动故事的不同之处。

一轮轮输出,每轮的输出格式严格按如下格式:
1.  首先，直接输出故事内容，可以使用段落、加粗等任何Markdown格式，但不要有"故事内容:"这样的前缀标签。
2.  空一行。
3.  接下来三行，每行是一个选项，必须使用Markdown链接格式：[选项X: 选项描述](action:choice-X)，其中X是1, 2, 3。

示例（一轮的输出）:
你走在一条幽暗的森林小径上，月光被茂密的树冠筛得支离破碎。远处传来狼嚎，让你不禁打了个寒颤。你记得地图上标记，穿过这片森林就能找到传说中的智者，但眼前的路似乎有两条岔路。

[选项一: 沿着左边看似有人走过的小径前进，虽然更黑暗，但可能有线索。](action:choice-1)
[选项二: 选择右边开阔些的大路，虽然可能绕远，但感觉更安全。](action:choice-2)
[选项三: 原地等待，看看天亮后会不会有其他旅人经过。](action:choice-3)

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
    
    async def generate_response(self, conversation: Conversation):
        print(len(self.get_specific_messages(conversation, "story")))
        stream = await self.chat.chat.completions.create(
            model='gpt-5',
            messages = [{"role": "system", "content": self.prompts["system"].format(storytopic=conversation.story_topic, storytype=conversation.story_type)},
                        *self.get_specific_messages(conversation, "story")],
            stream=True,
        )
        
        async for content in self._stream_response_content(stream):
            yield content



