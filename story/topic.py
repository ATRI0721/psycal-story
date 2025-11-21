from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
import re,ast

chat = ChatOpenAI(
        # base_url='https://api.zhizengzeng.com/v1',
        # api_key='sk-zk20439d91128d398f27da3cbd5d53e8e9669082e88ba5a1',
        base_url='https://api.openai-proxy.org/v1',
        api_key='sk-U7B0hD9SXkutlHX0SIziO3hNG03i4L8XR9KTWrpyCizamEks',
        model='gpt-5'
)

system_prompt='''
用户是一名青少年,你是一个专业的心理咨询师。
要求1.请你就用户的问题给出简短地共情与安慰。
要求2.请你简洁地举3个不同的场景来细化这一问题类型供用户选择
输出严格按照python字典的形式(键:"共情","情境一","情境二","情境三")
语言风格要贴近中学生。
'''
prompt_topic = ChatPromptTemplate.from_messages([
    ("system",system_prompt ),
    MessagesPlaceholder(variable_name="history"),  # 历史记录（自动填充）
    ("human", "{topic}")
])

# 用字典保存每个 session 的历史
historiy_topic = {}

def get_session_history(session_id):
    if session_id not in historiy_topic:
        historiy_topic[session_id] = ChatMessageHistory()
    return historiy_topic[session_id]

conversation_topic = RunnableWithMessageHistory(
    prompt_topic | chat,
    get_session_history,
    input_messages_key="topic",     
    history_messages_key="history"    
)


def topic():
    problem=["学业问题","家庭问题","师生关系","童年经历","生活方式","同学关系"]
    print("选择你遇到的烦恼类型(可多选):")
    for i in range(len(problem)):
        print("{0}.{1}".format(i+1,problem[i]))

    # First
    topic="用户选择的烦恼类型: "
    choice=str(input("选择/自行输入:\n"))
    #选择选项或者自己输入
    if choice.isdigit():
        for i in choice:
            topic=topic+problem[int(i)-1]+" "
    else:
        topic+=choice+" "

    topic+="用户选择的相似情境:"
    
    for i in range(2):
        data={}
        count=0
        while "共情" not in data or "情境一" not in data or "情境二" not in data or "情境三" not in data:
            customer_response=conversation_topic.invoke(
                {"topic":topic},
                config={"configurable": {"session_id": "user"}}
            ).content

            match = re.search(r'\{.*\}', customer_response, re.S)
            if match:
                json_str = match.group(0)
                data = ast.literal_eval(json_str)
            count+=1
            if count>=3:
                print("多次未能获取有效响应，请检查系统。")
                return topic
        
        print("AI:",data["共情"],"\n")
        print("情境一:",data["情境一"])
        print("情境二:",data["情境二"])
        print("情境三:",data["情境三"])

        choice=str(input("请选择相似的情境，或自行输入新的情境：\n"))
        if choice.isdigit():
            for i in choice:
                if int(i)==1:
                    topic=topic+data["情境一"]+" "
                elif int(i)==2:
                    topic=topic+data["情境二"]+" "
                elif int(i)==3:
                    topic=topic+data["情境三"]+" "
        else:
            topic+=choice+" "
    return topic

if __name__ == '__main__':
    topic()