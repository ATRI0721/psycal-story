import {  ConversationResponse,CreateConversationResponse, Message } from "../types";
import api from "./setting";


// src/api/chat.ts
export const chatAPI = {
  getConversations: () => api.get<ConversationResponse[]>("/chat/conversations"),

  createConversation: (title?: string) =>
    api.post<CreateConversationResponse>("/chat/conversation", { title }),

  updateTitle: (conversationId: string, title: string) =>
    api.patch<ConversationResponse>(`/chat/conversation/${conversationId}`, { title }),

  // generateTitle: (conversationId: string) =>
  //   api.stream(`/chat/conversation/${conversationId}/generate-title`,  {method: "GET"}),

  getMessages: (conversationId: string) =>
    api.get<Message[]>(`/chat/conversation/${conversationId}/messages`),

  deleteConversation: (conversationId: string) =>
    api.delete<ConversationResponse>(`/chat/conversation/${conversationId}`),

  deleteAllConversations: () => api.delete<ConversationResponse[]>(`/chat/conversations`),

  sendMessage: (conversationId: string, message: string) =>
    api.stream(`/chat/completions/${conversationId}`,  {
      method: "POST",
      body: JSON.stringify({ message })
    }),

  regenerateMessage: (conversationId: string, messageId: string) =>
    api.stream(`/chat/completions/${conversationId}/regenerate/${messageId}`,  {
      method: "GET",
    }),
};
