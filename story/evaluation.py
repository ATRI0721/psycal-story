from story import story,chat,storytopic
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory


with open("history_story.txt",'r',encoding='utf-8') as f:
    story()
    story=f.read()

def evaluation():
    system_prompt='''
            你是一个具有帮助功能的心理咨询师，用户完成了一段与其烦恼相似的互动故事。
            从中选取提炼出一个用户做出的消极选择或思维陷阱，之后用苏格拉底式提问法引导用户反思这些选择背后的认知偏差，并帮助用户发现更积极的应对策略，每次最多只问一个问题。
            当你觉得提问已经进行的差不多了就给出简短总结和鼓励。
            用户的烦恼：{storytopic}
            互动故事：{story}
        '''

    prompt_story=ChatPromptTemplate.from_messages([
        ("system",system_prompt),
        MessagesPlaceholder(variable_name="history"),  # 历史记录（自动填充）
        ("human", "{message}")
    ])

    history_evaluation = {}

    def get_session_history(session_id):
        if session_id not in history_evaluation:
            history_evaluation[session_id] = ChatMessageHistory()
        return history_evaluation[session_id]

    conversation_story = RunnableWithMessageHistory(
        prompt_story | chat,
        get_session_history,
        input_messages_key="message",     
        history_messages_key="history"    
    )

    message='NULL'
    while True:
        customer_response=conversation_story.invoke(
            {"message":message,"storytopic":storytopic,"story":story},
            config={"configurable": {"session_id": "user"}}
        ).content
        print(customer_response)
        message=input("输入你的回答(输入exit退出并保存):\n")

        if message=='exit':
            break
    with open("history_evaluation.txt", "w", encoding="utf-8") as f:
        for msg in history_evaluation["user"].messages:
            f.write(f"[{msg.type.upper()}] {msg.content}\n")

if __name__ == '__main__':
    evaluation()