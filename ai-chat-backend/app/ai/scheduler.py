from io import StringIO
from typing import AsyncGenerator
from sqlmodel import Session
from app.ai.evaluation import EvaluationModel
from app.ai.story import StoryModel
from app.ai.topic import TopicModel
from app.curd import add_message
from app.models.database import Conversation, Message
from app.ai.initmessages import ask_problems


class AgentScheduler:
    def __init__(self):
        self.topic_model = TopicModel()
        self.story_model = StoryModel()
        self.evaluation_model = EvaluationModel()

    async def process_message(self, conversation: Conversation, ai_message: Message) -> AsyncGenerator[str, None]:
            user_message = conversation.messages[-1]
            content_buffer = StringIO()
            model = None
            user_message.stage = conversation.messages[-2].stage
            if conversation.stage == "initial":
                conversation.story_type = user_message.content.strip()
                yield ask_problems
                content_buffer.write(ask_problems)
            elif conversation.stage == "topic":
                model = self.topic_model
            elif conversation.stage == "story":
                if conversation.story_topic is None:
                    conversation.story_topic = f"用户选择的烦恼类型: {conversation.messages[-2].content}\n用户描述的具体烦恼: {user_message.content}"
                model = self.story_model
            elif conversation.stage == "evaluation":
                model = self.evaluation_model
            else:
                raise ValueError(f"Unknown conversation stage: {conversation.stage}")
            
            if model:
                stream = model.generate_response(conversation)
                async for content in stream:
                    content_buffer.write(content)
                    yield content
            
            content = content_buffer.getvalue()
            content_buffer.close()

            if content.strip():
                ai_message.content = content
                ai_message.stage = conversation.stage
                self.update_conversation(conversation, user_message.content, content) 

            
    def update_conversation(self, conversation: Conversation, user_message: str, content: str):
        stage = conversation.stage
        if stage == "initial":
            conversation.stage = "topic"
        elif stage == "topic":
            conversation.stage = "story"
        elif stage == "story":
            if "互动结局" in content or "真实结局" in content:
                conversation.stage = "evaluation"
        elif stage == "evaluation":
            pass
        else:
            raise ValueError(f"Unknown conversation stage: {stage}")
    
        
scheduler = AgentScheduler()
