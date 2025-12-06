import { proxy } from "valtio";
import { derive } from "derive-valtio";
import type {
  Message,
  Story,
  StoryMessage,
  StorywithoutMessages,
} from "../types";

interface StoryState {
  storyList: StorywithoutMessages[];
  storyCache: Record<string, Story>;
  currentStoryMessage: StoryMessage | null;
}

export const storyState = proxy<StoryState>({
  storyCache: {},
  currentStoryMessage: null,
  storyList: [],
});

export const storyGetters = derive({
  currentStoryId: (get) => {
    const { currentStoryMessage } = get(storyState);
    return currentStoryMessage?.story_id;
  },
  currentStory: (get) => {
    const { currentStoryMessage, storyCache } = get(storyState);
    return storyCache[currentStoryMessage?.story_id??""];
  },
  storyBranchMessages: (get)  => {
    const { currentStoryMessage, storyCache } = get(storyState);

    if (!currentStoryMessage) return [];

    const story = storyCache[currentStoryMessage.story_id];
    if (!story) return [];

    const map: Record<string, StoryMessage> = {};
    story.story_messages.forEach((m) => (map[m.id] = m));

    const result: StoryMessage[] = [];
    let cur: StoryMessage | null = currentStoryMessage;

    while (cur) {
      result.unshift(cur);
      cur = cur.parent_id ? map[cur.parent_id] || null : null;
    }
    return result;
  },
});

export const storyActions = {
  initStoryList(storys: StorywithoutMessages[]) {
    storyState.storyList = storys;
  },

  addStory(story: Story) {
    storyState.storyCache[story.id] = story;
    const exists = storyState.storyList.find((s) => s.id === story.id);
    if (!exists) {
      storyState.storyList.unshift(story);
    }
  },


  renameStory(storyId: string, newTitle: string) {
    const storyMeta = storyState.storyList.find((s) => s.id === storyId);
    if (storyMeta) {
      storyMeta.title = newTitle;
    }
    const story = storyState.storyCache[storyId];
    if (story) {
      story.title = newTitle;
    }
  },

  deleteStory(storyId: string) {
    storyState.storyList = storyState.storyList.filter((s) => s.id !== storyId);
    delete storyState.storyCache[storyId];
    if (storyState.currentStoryMessage?.id === storyId) {
      storyState.currentStoryMessage = null;
    }
  },

  deleteAllStories() {
    storyState.currentStoryMessage = null;
    storyState.storyCache = {};
    storyState.storyList = [];
  },

  selectStory(storyId: string) {
    const s = storyState.storyList.find((s) => s.id === storyId);
    if (!s) return false;
    const story = storyState.storyCache[storyId];
    if (!story) {
      storyState.currentStoryMessage = null;
    } else {
      storyState.currentStoryMessage =
        story.story_messages[story.story_messages.length - 1];
    }
    return true;
  },

  selectStoryMessage(msg: StoryMessage | null) {
    if (!msg) {storyState.currentStoryMessage = null;return;}
    const story = storyState.storyCache[msg.story_id];
    if (story) {
      const latestMsg = story.story_messages.find(m => m.id === msg.id);
      if (latestMsg) {
        storyState.currentStoryMessage = latestMsg;
        return;
      }
    }
    // 如果找不到，使用传入的消息
    storyState.currentStoryMessage = msg;
  },

  selectStoryMessageById(storyId: string, messageId: string) {
    const story = storyState.storyCache[storyId];
    if (!story) return;
    
    const message = story.story_messages.find(m => m.id === messageId);
    if (message) {
      storyState.currentStoryMessage = message;
    }
  },

  appendStoryMessage(msg: StoryMessage) {
    const story = storyState.storyCache[msg.story_id];
    if (!story) return;
    story.story_messages.push(msg);
  },

  updateStoryMessage(
    storyId: string,
    msgId: string,
    updater: (msg: StoryMessage) => void
  ) {
    const story = storyState.storyCache[storyId];
    if (!story) return;

    const index = story.story_messages.findIndex((m) => m.id === msgId);
    if (index === -1) return;

    updater(story.story_messages[index]);
  },

  appendConversationMessage: (message: Message) => {
    const { currentStoryMessage } = storyState;
    if (!currentStoryMessage) return;
    currentStoryMessage.conversation.messages.push(message);
  },

  updateConversationMessage: (
    storyId: string,
    storyMessageId: string,
    conversationMessageId: string,
    updater: (msg: Message) => void
  ) => {
    const story = storyState.storyCache[storyId];
    if (!story) return;
    const targetMsg = story.story_messages.find((m) => m.id === storyMessageId);
    if (targetMsg && targetMsg.conversation) {
      const convMsgIndex = targetMsg.conversation.messages.findIndex(
        (m) => m.id === conversationMessageId
      );
      if (convMsgIndex > -1) {
        updater(targetMsg.conversation.messages[convMsgIndex]);
      }
    }
  },
};
