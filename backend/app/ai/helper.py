from app.models.dto import StoryDTO, StoryMessageDTO
from openai import AsyncOpenAI

from app.ai.basemodel import BaseModel
from app.models.database import Story, StoryMessage
from app.core.config import settings


chat = AsyncOpenAI (
    base_url=settings.CHAT_MODEL_URL,
    api_key=settings.MODEL_API_KEY,
)

strategy=[
    "肯定用户的选择或想法 (示例:我觉得你做出的选择很好，也很勇敢。)",
    "结合故事分析用户选择后产生的影响 (示例：你看，你这样做加深了冲突)" 
    "询问用户做出这个选择后感觉如何 (示例:当你做出这个选择后感觉怎么样？)",
    "询问用户为什么要做出这个选择 (示例:我能问问你为什么要做这个选择吗？)",
    "问问用户为什么要改变自己的选择 (示例:你为什么改变了自己的选择呢，你在想什么？)",
    "回答用户的问题或回应用户的回答 (示例:是的，牛顿发现了万有引力)",
    "给用户鼓励与心理支持 (我相信你能克服这个困难，很多人都面临和你一样的问题，别灰心)",
    "询问用户要不要尝试做出其他选择 (示例:你要不要再尝试一下其它的选择呢？)",
] 

system_prompt=\
'''
用户的烦恼类型是:{{problem_type}}，具体的情境是:{{situation}}
你是一个使用叙事疗法的心理咨询师，用户正在进行互动故事，故事历史是{{history_story}},用户在上一个故事段已经做过的选择是{{history_choice}}
你不续写故事，你应结合故事与用户的烦恼进行分析。
你应该从下面的策略库中选择一个最合适的执行。输出长度应适中，不要一次问太多问题。
//
策略库:{strategy}
//
'''.format(strategy=strategy)

prompts = {
    "system": system_prompt
}

def get_choice(story: StoryDTO, story_message: StoryMessageDTO):
    id_map = {m.id: m for m in story.story_messages}
    try:
        parent = id_map.get(story_message.parent_id)
        grandparent=id_map.get(parent.parent_id)

        choice_message = ""
        for i, choice in enumerate(grandparent.children, start=1): 
            choice_message += f"{i}. {choice.content}\n"
    except:
        choice_message = ""
        
    return choice_message

class HelperModel(BaseModel):
    def __init__(self):
        super().__init__(prompts, chat)
    
    async def generate_response(self, story: StoryDTO, story_message: StoryMessageDTO, user_message: str):
        conversation_msgs = [
            {"role": m.role, "content": m.content} for m in story_message.conversation.messages[:-2]
        ]
        stream = await chat.chat.completions.create(
                model=settings.CHAT_MODEL,
                messages = [{"role": "system", "content": self.prompts["system"].format(
                     situation=story.situation, problem_type=story.problem_type,
                     history_story=self.get_main_story(story, story_message),
                     history_choice= get_choice(story,story_message),
                     )},
                *self._to_openai_message(conversation_msgs),
                {"role": "user", "content": user_message}],
                stream=True,
            )

        async for content in self._stream_response_content(stream):
            yield content

helpermodel = HelperModel()
   
