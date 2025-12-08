ask_problems = ["学业压力","同伴关系","家庭问题","情绪困扰","自我认同与自尊问题","情感问题","身体与青春期烦恼"]
ask_story_type='''输入你喜欢的故事类型：'''

ask_problems = "输入你目前最困扰你的问题类型:\n" + "\n".join([f"[{s}](action:problem-{i+1})" for i, s in enumerate(ask_problems)])

start_story = "[开始互动故事](action:start-story)"