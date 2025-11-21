from topic import topic,chat
from langchain_openai import ChatOpenAI     
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
import re,ast

storytopic=topic()
system_prompt='''
用户的烦恼：{storytopic}
用户喜欢的故事类型：{storytype}
你的目的是基于用户的烦恼，从用户喜欢的故事类型中寻找一个相似情境的故事。
你要构建一个互动故事，让用户第一人称扮演这个角色。故事持续5轮左右，每轮大概500字左右，故事不要做太多改编，与真实故事不同的地方按逻辑续写。
故事应具有充分的细节，把握好故事节奏。每轮给用户设计3个选项，其中有一两个选项是思维陷阱，结局按照选择决定好坏。
在故事中先不要出现角色的信息，在结局之后告诉用户真实故事是什么、与互动故事的不同之处。
一轮轮输出,每轮的输出格式严格按照python字典的形式(键:"故事内容","选项一","选项二","选项三"}})。
结局的输出格式严格按照python字典的形式(键:"真实结局","互动结局")。
'''

prompt_story=ChatPromptTemplate.from_messages([
    ("system",system_prompt),
    MessagesPlaceholder(variable_name="history"),  # 历史记录（自动填充）
    ("human", "{message}")
])

history_story = {}

def get_session_history(session_id):
    if session_id not in history_story:
        history_story[session_id] = ChatMessageHistory()
    return history_story[session_id]

conversation_story = RunnableWithMessageHistory(
    prompt_story | chat,
    get_session_history,
    input_messages_key="message",     
    history_messages_key="history"    
)

def story():
    message="开始"
    print("故事开始构建......")
    storytype=input("输入你喜欢的故事类型：")
    while(True):
        customer_response=conversation_story.invoke(
            {"message":message,"storytopic":storytopic,"storytype":storytype},
            config={"configurable": {"session_id": "user"}}
        ).content

        match = re.search(r"\{.*\}", customer_response, re.S)
        if match:
            json_str = match.group(0)
            content = ast.literal_eval(json_str)
        if "真实结局" in content:
            print("故事结束！")
            print("真实结局:",content["真实结局"])
            print("互动结局:",content["互动结局"])
            print("分析:",content["分析"])
            message=input("输入exit保存并退出")

        else:
            print("*****第{i}轮*****".format(i=len(history_story["user"].messages)//2))
            print(content["故事内容"])
            print("在此情景下,你最可能做出的选择是什么?:")
            print("选项一:",content["选项一"])
            print("选项二:",content["选项二"])
            print("选项三:",content["选项三"])
            message=input("请选择你的选项(输入exit退出)：\n")

        if message == "exit":
            with open("history_story.txt", "w", encoding="utf-8") as f:
                for msg in history_story["user"].messages:
                    f.write(f"[{msg.type.upper()}] {msg.content}\n")
            break
if __name__ == "__main__":
    story()