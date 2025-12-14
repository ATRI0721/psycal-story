// src/services/storyService.ts
import chatAPI from "../api/chat";
import { storyActions, storyGetters, storyState } from "../stores/storyStore";
import type { Message, StoryMessage, StreamResponse } from "../types";
import { uiActions, uiState } from "../stores/uiStore";
import { handleError } from "../stores/middleware";


// 生成一个简单的临时ID
function generateTempId() {
  return `temp-${new Date().getTime()}-${Math.floor(Math.random() * 1000000)}`;
}

export const storyService = {
  /**
   * 获取所有故事列表并初始化Store
   */
  async fetchStories() {
    try {
      uiState.loading = true;
      const storyList = await chatAPI.getStorys();
      storyActions.initStoryList(storyList);
    } catch (error) {
      handleError("fetchStories", error);
    } finally {
      uiState.loading = false;
    }
  },

  /**
   * 创建一个新故事
   */
  async createStory(title: string = "新故事") {
    try {
      uiState.loading = true;
      const newStory = await chatAPI.createStory(title);
      storyActions.addStory(newStory);
      storyActions.selectStory(newStory.id);
      return newStory;
    } catch (error) {
      handleError("createStory", error);
    } finally {
      uiState.loading = false;
    }
  },

  /**
   * 加载一个故事到缓存并选中它
   */
  async loadStory(storyId: string) {
    try{
      if (!storyActions.selectStory(storyId)) {
        throw new Error("Story not found in list");
      }
      if (storyState.currentStoryMessage) return; // 已经加载过了
      uiActions.getStoryUIState(storyId).loading = true;
      const story = await chatAPI.getStory(storyId);
      storyActions.addStory(story);
      storyActions.selectStory(storyId);
    } catch (error) {
      handleError("loadStory", error);
    } finally {
      uiActions.getStoryUIState(storyId).loading = false;
    }
  },

  async renameStory(storyId: string, newTitle: string) {
    try {
      await chatAPI.updateTitle(storyId, newTitle);
      storyActions.renameStory(storyId, newTitle);
    } catch (error) {
      handleError("renameStory", error);
    }
  },

  async deleteStory(storyId: string) {
    if (storyGetters.currentStoryId === storyId){
      storyActions.selectStoryMessage(null);
    }
    chatAPI.deleteStory(storyId).then(() => {
      storyActions.deleteStory(storyId);
    }).catch(err => {
      handleError("deleteStory", err);
    });
  },

  async deleteAllStorise(){
    chatAPI.deleteAllStorys().then(() => {
      storyActions.deleteAllStories();
    }).catch(err => {
      handleError("deleteAllStorise", err);
    })
  },

  /**
   * 发送消息，创建新的故事分支（核心功能）
   * @param content 用户输入的消息内容
   */
  async sendMessageToBranch(content: string) {
    const currentStoryMessage = storyState.currentStoryMessage;
    if (!currentStoryMessage) {
      handleError("sendMessageToBranch", new Error("No current story message selected."));
      return;
    }

    if (uiActions.getStoryUIState(currentStoryMessage.story_id).loading){
      handleError("sendMessageToBranch", new Error("Previous message is still loading."));
      return;
    }

    const { story_id } = currentStoryMessage;
    const parentMessageId = currentStoryMessage.id;

    let ai_message_id = generateTempId();
    let user_message_id = generateTempId();

    currentStoryMessage.children_id.push(user_message_id);

    // 1. 乐观更新：立即在UI上显示用户的消息
    const tempUserMessage: StoryMessage = {
      id: user_message_id,
      story_id,
      parent_id: parentMessageId,
      content,
      role: "user",
      conversation: { messages: [], title: "" },
      stage: "inProgress",
      children_id: [ai_message_id],
    };

    const tempAiMessage: StoryMessage = {
      id: ai_message_id,
      story_id,
      parent_id: user_message_id, // AI消息是用户消息的子节点
      content: "",
      role: "assistant",
      conversation: { messages: [], title: "" },
      stage: "inProgress",
      children_id: [],
    };
    storyActions.appendStoryMessage(tempUserMessage);
    storyActions.appendStoryMessage(tempAiMessage);
    storyActions.selectStoryMessage(tempAiMessage); // 选中AI消息，以便流式更新

    uiActions.getStoryUIState(story_id).loading = true;

    // 3. 调用API并发起流式请求
    try {
      const stream = await chatAPI.sendStoryMessage(
        story_id,
        parentMessageId,
        content
      );
      const handleChunk = (data: StreamResponse) => {
        if (data.type === "init") {
          storyActions.updateStoryMessage(story_id, user_message_id, (msg) => {
            msg.id = data.user_message_id;
            msg.children_id = [data.ai_message_id]
          });

          storyActions.updateStoryMessage(
            story_id,
            ai_message_id,
            (msg) => {
              currentStoryMessage.children_id.pop();
              currentStoryMessage.children_id.push(data.user_message_id);
              msg.id = data.ai_message_id;
              msg.parent_id = data.user_message_id;
            }
          );
          user_message_id = data.user_message_id;
          ai_message_id = data.ai_message_id;
        }else if (data.type === "message") {
          storyActions.updateStoryMessage(
            story_id,
            ai_message_id,
            (msg) => {
              msg.content = msg.content + data.value;
              msg.stage = data.done ? (data.stage || "inProgress") : msg.stage;
            }
          );
        }
      }
      await handleStream(stream, handleChunk);
      storyService.sendMessageToConversation("开始", story_id, ai_message_id);
    } catch (error) {
      handleError("sendMessageToBranch", error);
      storyActions.updateStoryMessage(story_id, ai_message_id, (msg) => {
        msg.content = "发送失败，请重试。";
      });
    } finally {
      uiActions.getStoryUIState(story_id).loading = false;
    }
  },

  /**
   * 发送旁白消息到当前节点的conversation（核心功能）
   * @param content 用户输入的旁白内容
   */
  async sendMessageToConversation(content: string, storyId: string, storyMessageId: string) {
    const currentStoryMessage = storyActions.getStoryMessageById(storyId, storyMessageId);

    if (!currentStoryMessage) {
      handleError("sendMessageToConversation", new Error("No current story message selected."));
      return;
    }

    if (uiActions.getConversationUIState(currentStoryMessage.id).loading){
      handleError("sendMessageToConversation", new Error("Previous message is still loading."));
      return;
    }

    let ai_message_id = generateTempId();
    let user_message_id = generateTempId();

    // 1. 乐观更新：立即在UI上显示用户消息
    const tempUserMessage: Message = {
      id: user_message_id,
      role: "user",
      content,
    };

    // 2. 创建一个空的AI消息占位符
    const tempAiMessage: Message = {
      id: ai_message_id,
      role: "assistant",
      content: "",
    };
    storyActions.appendConversationMessage(tempUserMessage, currentStoryMessage);
    storyActions.appendConversationMessage(tempAiMessage, currentStoryMessage);
    uiActions.getConversationUIState(currentStoryMessage.id).loading = true;

    // 3. 调用API并发起流式请求
    try {
      const stream = await chatAPI.sendConversationMessage(
        storyId,
        storyMessageId,
        content
      );
      const handleChunk = (data: StreamResponse) => {
        if (data.type === "init") {
          storyActions.updateConversationMessage(
            storyId,
            storyMessageId,
            user_message_id,
            (msg) => {
              msg.id = data.user_message_id;
            }
          );
          storyActions.updateConversationMessage(
            storyId,
            storyMessageId,
            ai_message_id,
            (msg) => {msg.id = data.ai_message_id;}
          );
          user_message_id = data.user_message_id;
          ai_message_id = data.ai_message_id;
        } else if (data.type === "message") {
          storyActions.updateConversationMessage(
            storyId,
            storyMessageId,
            ai_message_id,
            (msg) => {msg.content = msg.content + data.value;}
          );
        }
      };
      await handleStream(stream, handleChunk);
    } catch (error) {
      handleError("sendMessageToConversation", error);
      storyActions.updateConversationMessage(
        storyId,
        storyMessageId,
        ai_message_id,
        (msg) => {msg.content = "发送失败，请重试。";}
      );
    }finally {
      uiActions.getConversationUIState(currentStoryMessage.id).loading = false;
    }
  },
};

async function handleStream(
  response: Response,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  handleChunk: (data) => void
) {
  if (!response.ok || !response.body) {
    throw new Error("Invalid response");
  }

  const stream = response.body;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  async function read(): Promise<void> {
    const { value, done } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      try {
        handleChunk(JSON.parse(line));
      } catch {
        handleError("handleStream", new Error(`Failed to parse message: ${line}`));
      }
    }
    return read();
  }

  await read();
  if (buffer.trim()) {
    handleChunk(JSON.parse(buffer));
  }
}
