ask_problems = ["学业问题","家庭问题","师生关系","童年经历","生活方式","同学关系"]
ask_story_type='''输入你喜欢的故事类型：'''

ask_problems = "输入你目前最困扰你的问题类型:\n" + "\n".join([f"[{s}](action:problem-{i+1})" for i, s in enumerate(ask_problems)])

start_story = "[开始互动故事](action:start-story)"