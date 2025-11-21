import { create } from "zustand";
import { Conversation, StreamTitleResponse } from "../types";
import { chatAPI } from "../api/chat";
import { checkToken, handleStream } from "../utils";
import { useMessageStore } from "./messageStore";
import { errorHandlingMiddleware } from "./middleware";
import { MessageRole } from "../types/index"


interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string;
  isInit: boolean;

  fetchConversations: () => Promise<void>;
  createConversation: () => Promise<Conversation | null>;
  selectConversation: (id: string) => void;
  reNameConversation: (id: string, title: string) => Promise<void>;
  // generateTitle: (cid: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  init: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>()(
  errorHandlingMiddleware<ConversationState>()(
    (set, get) => ({
      conversations: [],
      currentConversationId: "",
      isInit: false,

      fetchConversations: async () => {
        if (!checkToken()) return;
        const response = await chatAPI.getConversations();
        set({
          conversations: response.map((c) => ({ ...c, loading: false })),
        });
      },

      createConversation: async () => {
        if (!checkToken()) return null;
        const response = await chatAPI.createConversation();
        const conversation = { ...response, loading: false };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: response.id,
        }));
        return conversation;
      },

      selectConversation: (id) => {
        if (!checkToken()) return;
        if (id === "") {
          set({ currentConversationId: id });
          useMessageStore.setState({ messages: init_messages });
          return;
        }
        const conversation = get().conversations.find((c) => c.id === id);
        const cid = get().currentConversationId;
        if (!conversation || cid === id) return;
        set({ currentConversationId: id });
        useMessageStore
          .getState()
          .getMessages(id)
          .then((m) => {
            useMessageStore.setState({
              messages: m,
              loading: conversation?.loading,
              messageCache: {
                ...useMessageStore.getState().messageCache,
                [id]: m,
              },
            });
          });
      },

      reNameConversation: async (id, title) => {
        if (!checkToken() || !title.trim()) return;
        const r = await chatAPI.updateTitle(id, title);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updated_at: r.updated_at } : c
          ),
        }));

      },

      // generateTitle: async (id) => {
      //   if (!checkToken()) return;
      //   try {
      //     const r = await chatAPI.generateTitle(id);
      //     if (!r.ok || !r.body) throw new Error("Failed to generate title");

      //     let accumulated = "";
      //     const _update_title = (s: StreamTitleResponse) => {
      //       const v = s.updated_at?"":s.value;
      //       accumulated += v; 
      //       set((state) => ({
      //         conversations: state.conversations.map((c) =>
      //           c.id === id
      //             ? {
      //                 ...c,
      //                 title: accumulated,
      //                 updated_at: s.updated_at || c.updated_at,
      //               }
      //             : c
      //         ),
      //       }));
      //     };

      //     await handleStream(r.body, _update_title);
      //   } catch (e) {
      //     handleError(e);
      //   }
      // },

      deleteConversation: async (id) => {
        if (!checkToken()) return;
        await chatAPI.deleteConversation(id);
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        }));
        if (get().currentConversationId === id) {
          set({ currentConversationId: "" });
        }
      },

      deleteAllConversations: async () => {
        if (!checkToken()) return;
        await chatAPI.deleteAllConversations();
        set({ conversations: [], currentConversationId: "" });
      },

      init: async () => {
        await get().fetchConversations();
        const currentId = get().currentConversationId;
        set({ currentConversationId: "" });
        get().selectConversation(currentId);
        set({ isInit: true });
      },
    }),
  )
);

const init_messages = [
  {
    id: "init-1",
    content: "输入你喜欢的故事类型：",
    role: "assistant" as MessageRole,
  }
];
