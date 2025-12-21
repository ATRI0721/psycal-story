import {  DeleteResponse, Story, StorywithoutMessages } from "../types";
import api from "./setting";


// src/api/chat.ts
const chatAPI = {
  getStorys: () => api.get<StorywithoutMessages[]>("/chat/storys"),

  createStory: (title: string = "新故事") =>
    api.post<Story>("/chat/story", { title }),

  updateTitle: (storyId: string, title: string) =>
    api.patch<Story>(`/chat/story/${storyId}`, { title }),

  getStory: (storyId: string) => api.get<Story>(`/chat/story/${storyId}`),

  deleteStory: (storyId: string) =>
    api.delete<DeleteResponse>(`/chat/story/${storyId}`),

  deleteAllStorys: () => api.delete<DeleteResponse>(`/chat/storys`),

  sendStoryMessage: (
    storyId: string,
    messageId: string,
    message_content: string
  ) =>
    api.stream(`/chat/completions/story/${storyId}/${messageId}`, {
      method: "POST",
      body: JSON.stringify({ message_content }),
    }),

  sendControlMessage: (
    storyId: string,
    messageId: string,
    message_content: string
  ) =>
    api.stream(`/chat/completions/control/${storyId}/${messageId}`, {
      method: "POST",
      body: JSON.stringify({ message_content }),
    }),

  sendConversationMessage: (
    storyId: string,
    messageId: string,
    message_content: string
  ) =>
    api.stream(`/chat/completions/conversation/${storyId}/${messageId}`, {
      method: "POST",
      body: JSON.stringify({ message_content }),
    }),
};

export default chatAPI;