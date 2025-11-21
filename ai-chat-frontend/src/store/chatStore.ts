import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Message,
  Conversation,
  StreamResponse,
  MessageRole,
  StreamMessageResponse,
  StreamInitResponse,
} from "../types";
import { chatAPI } from "../api/chat";
import { handleError } from "./errorStore";

// ------------------ 工具函数 ------------------
function checkToken() {
  const token = localStorage.getItem("token");
  return token && token.trim().length > 0;
}

function getTempId() {
  return crypto.randomUUID();
}

async function handleStream(
  stream: ReadableStream,
  handleMessage: (data: StreamResponse) => void
) {
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
        handleMessage(JSON.parse(line));
      } catch {
        handleError(new Error(`Failed to parse message: ${line}`));
      }
    }
    return read();
  }

  await read();
  if (buffer.trim()) {
    handleMessage(JSON.parse(buffer));
  }
}

async function processStream(
  stream: ReadableStream,
  handlers: {
    onMessage?: (data: StreamMessageResponse) => void;
    onInit?: (data: StreamInitResponse) => void;
  }
) {
  await handleStream(stream, (data) => {
    if (data.type === "message" && handlers.onMessage) {
      handlers.onMessage(data);
    } else if (data.type === "init" && handlers.onInit) {
      handlers.onInit(data);
    }
  });
}

// ------------------ Zustand Store ------------------
interface ChatState {
  conversations: Conversation[];
  currentConversationId: string;
  messages: Message[];
  loading: boolean;
  isInit: boolean;
  messageCache: Record<string, Message[]>;

  init: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  createConversation: (message: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  reNameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  handleStreamMessage: (
    data: StreamMessageResponse,
    currentConversationId: string
  ) => void;
  setMessages: (id: string, messages: Message[]) => void;
  getMessages: (id: string) => Promise<Message[]>;
  regenerateMessage: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: "",
      messages: [],
      loading: false,
      isInit: false,
      messageCache: {},

      fetchConversations: async () => {
        if (!checkToken()) return;
        try {
          const response = await chatAPI.getConversations();
          set({
            conversations: response.map((c) => ({ ...c, loading: false })),
          });
        } catch (e) {
          handleError(e);
        }
      },

      createConversation: async (message) => {
        if (!checkToken()) return;
        try {
          const response = await chatAPI.createConversation();
          set((state) => ({
            conversations: [
              { ...response, loading: false },
              ...state.conversations,
            ],
            currentConversationId: response.id,
            messages: [],
          }));
          await get().sendMessage(message);
        } catch (e) {
          handleError(e);
        }
      },

      getMessages: async (id) => {
        if (!checkToken() || !get().conversations.find((c) => c.id === id))
          return [];
        try {
          if (get().messageCache[id]) {
            return get().messageCache[id];
          }
          const response = await chatAPI.getMessages(id);
          if (!response) throw new Error("Invalid response");
          get().messageCache[id] = response;
          return response;
        } catch (e) {
          handleError(e);
          return [];
        }
      },

      selectConversation: async (id) => {
        if (!checkToken()) return;
        const { conversations, currentConversationId, messages, messageCache } =
          get();

        const conversation = conversations.find((c) => c.id === id);
        if (!conversation && id !== "") return;

        messageCache[currentConversationId] = messages;
        set({ currentConversationId: id });

        if (id === "") {
          set({ messages: [] });
          return;
        }

        if (messageCache[id]?.length) {
          set({ messages: messageCache[id] });
        } else {
          await get().getMessages(id);
        }
      },

      reNameConversation: async (id, title) => {
        if (!checkToken() || !title.trim()) return;
        const conversation = get().conversations.find((c) => c.id === id);
        if (!conversation || conversation.title === title) return;

        try {
          const r = await chatAPI.updateTitle(id, title);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, title, update_time: r.update_time } : c
            ),
          }));
        } catch {
          handleError(new Error("Failed to rename conversation"));
        }
      },

      deleteConversation: async (id) => {
        if (!checkToken()) return;
        try {
          await chatAPI.deleteConversation(id);
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
          }));
          if (get().currentConversationId === id) {
            set({ currentConversationId: "" });
          }
          delete get().messageCache[id];
        } catch (e) {
          handleError(e);
        }
      },

      deleteAllConversations: async () => {
        if (!checkToken()) return;
        try {
          await chatAPI.deleteAllConversations();
          set({ conversations: [], currentConversationId: "", messages: [] });
          get().messageCache = {};
        } catch (e) {
          handleError(e);
        }
      },

      init: async () => {
        await get().fetchConversations();
        const currentConversationId = get().currentConversationId;
        if (
          !(
            currentConversationId === "" ||
            get().conversations.find((c) => c.id === currentConversationId)
          )
        ) {
          set({ currentConversationId: "" });
          return;
        }
        await get().selectConversation(currentConversationId);
        set({ isInit: true });
      },

      handleStreamMessage: (data, currentConversationId) => {
        set((state) => {
          const update = (msgs: Message[]) =>
            msgs.map((msg) =>
              msg.id === data.id
                ? { ...msg, content: msg.content + data.value }
                : msg
            );
          if (currentConversationId === state.currentConversationId) {
            return { messages: update(state.messages) };
          } else {
            state.messageCache[currentConversationId] = update(
              state.messageCache[currentConversationId] || []
            );
            return {};
          }
        });
      },

      setMessages: (id, messages) => {
        if (id === get().currentConversationId){
          set({ messages });
        }
        get().messageCache[id] = messages;
      },

      regenerateMessage: async (id) => {
        if (!checkToken()) return;
        const messageIndex = get().messages.findIndex((m) => m.id === id);
        if (messageIndex === -1) return;

        const tempId = getTempId();
        const currentConversationId = get().currentConversationId;

        set((state) => ({
          messages: [
            ...state.messages.slice(0, messageIndex),
            { id: tempId, content: "", role: "assistant" as MessageRole },
          ],
          conversations: state.conversations.map((c) =>
            c.id === currentConversationId
              ? { ...c, loading: true, update_time: new Date().toISOString() }
              : c
          ),
          loading: true,
        }));

        try {
          const response = await chatAPI.regenerateMessage(
            currentConversationId,
            id
          );
          if (!response.ok || !response.body)
            throw new Error("Invalid response");

          await processStream(response.body, {
            onMessage: (data) =>
              get().handleStreamMessage(data, currentConversationId),
            onInit: (data) => {
              const messages = get().getMessages(currentConversationId);
              messages.then((m) => {
                get().setMessages(currentConversationId, [
                  ...m.slice(0, -1),
                  {
                    ...m[m.length - 1],
                    id: data.ai_message_id,
                  },
                ]);
              })
            },
          });

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === currentConversationId ? { ...c, loading: false } : c
            ),
            loading: false,
          }));
        } catch (e) {
          handleError(e);
        }
      },

      sendMessage: async (content) => {
        if (!checkToken() || !content.trim()) return;
        const currentConversationId = get().currentConversationId;
        if (
          !currentConversationId ||
          !get().conversations.find((c) => c.id === currentConversationId)
        )
          return;

        const userTempId = getTempId();
        const aiTempId = getTempId();

        const userMessage: Message = { id: userTempId, content, role: "user" };
        const aiMessage: Message = {
          id: aiTempId,
          content: "",
          role: "assistant",
        };

        set((state) => ({
          messages: [...state.messages, userMessage, aiMessage],
          conversations: state.conversations.map((c) =>
            c.id === currentConversationId
              ? { ...c, loading: true, update_time: new Date().toISOString() }
              : c
          ),
          loading: true,
        }));

        try {
          const response = await chatAPI.sendMessage(
            currentConversationId,
            content
          );
          if (!response.ok || !response.body)
            throw new Error("Invalid response");

          await processStream(response.body, {
            onMessage: (data) =>
              get().handleStreamMessage(data, currentConversationId),
            onInit: (data) => {
              const messages = get().getMessages(currentConversationId);
              messages.then((m) => {
                get().setMessages(currentConversationId, [
                  ...m.slice(0, -2),
                  {
                    ...m[m.length - 2],
                    id: data.user_message_id,
                  },
                  {
                    ...m[m.length - 1],
                    id: data.ai_message_id,
                  },
                ]);
                })},
          });

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === currentConversationId ? { ...c, loading: false } : c
            ),
            loading: false,
          }));
        } catch (e) {
          handleError(e);
        }
      },
    }),
    {
      name: "chat-storage", // localStorage key
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        messageCache: state.messageCache,
      }),
    }
  )
);
