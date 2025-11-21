import { create } from "zustand";
import { Message, StreamMessageResponse, StreamInitResponse } from "../types";
import { chatAPI } from "../api/chat";
import { useConversationStore } from "./conversationStore";
import { checkToken, getTempId, processStream, withTimeWindow } from "../utils";
import { errorHandlingMiddleware } from "./middleware";
import functionalToast from "../components/Commend/Toast";

interface MessageState {
  messages: Message[];
  messageCache: Record<string, Message[]>;
  loading: boolean;

  getMessages: (id: string) => Promise<Message[]>;
  regenerateMessage: (id: string) => Promise<void>;
  sendMessage: (content: string, cid?: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>()(
  errorHandlingMiddleware<MessageState>()((set, get) => {

    /** 更新某个对话的消息并维护 cache */
    const updateMessages = (
      cid: string,
      updater: (msgs: Message[]) => Message[]
    ) => {
      const { currentConversationId } = useConversationStore.getState();
      set((state) => {
        const msgs = state.messageCache[cid] || state.messages;
        const newMsgs = updater(msgs);
        const newCache = { ...state.messageCache, [cid]: newMsgs };
        return {
          messageCache: newCache,
          messages: cid === currentConversationId ? newMsgs : state.messages,
        };
      });
    };

    /** 统一处理流式响应 */
    const handleStream = async (
      response: Response,
      cid: string,
      tempIds?: { user?: string; ai?: string }
    ) => {
      if (!response.ok || !response.body) {
        throw new Error("Invalid response");
      }

      await processStream(response.body, {
        onMessage: (data) => handleStreamMessage(data, cid),
        onInit: (data: StreamInitResponse) => {
          set((state) => {
            const msgs = state.messageCache[cid] || state.messages;
            const newMsgs = msgs.map((msg) => {
              if (tempIds?.user && msg.id === tempIds.user) {
                return { ...msg, id: data.user_message_id };
              }
              if (tempIds?.ai && msg.id === tempIds.ai) {
                return { ...msg, id: data.ai_message_id };
              }
              return msg;
            });
            return {
              messageCache: { ...state.messageCache, [cid]: newMsgs },
              messages:
                cid === useConversationStore.getState().currentConversationId
                  ? newMsgs
                  : state.messages,
            };
          });
        },
      });
    };

    const setLoading = (cid: string, loading: boolean) => {
      if (cid === useConversationStore.getState().currentConversationId) {
        set({ loading });
      }
      useConversationStore.setState((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === cid ? { ...c, loading } : c
        ),
      }));
    };

    const handleStreamMessage = (data: StreamMessageResponse, cid: string) => {
      updateMessages(cid, (msgs) =>
        msgs.map((msg) =>
          msg.id === data.id ? { ...msg, content: msg.content + data.value } : msg
        )
      );
    };

    const rawRegenerateMessage = async (id: string) => {
      if (!checkToken()) return;
      const { currentConversationId } = useConversationStore.getState();
      if (!currentConversationId) return;

      const conv = useConversationStore
        .getState()
        .conversations.find((c) => c.id === currentConversationId);
      if (conv?.loading) return;

      const pos = get().messages.findIndex((m) => m.id === id);
      if (pos === -1) return;

      try {
        const tempId = getTempId();

        updateMessages(currentConversationId, (old) => {
          if (get().loading) return old;
          const copy = [...old];
          copy.splice(pos, copy.length - pos, {
            id: tempId,
            content: "",
            role: "assistant",
          });
          return copy;
        });

        setLoading(currentConversationId, true);

        const response = await chatAPI.regenerateMessage(
          currentConversationId,
          id
        );
        await handleStream(response, currentConversationId, { ai: tempId });
      } catch (e) {
        throw e;
      } finally {
        setLoading(currentConversationId, false);
      }
    };

    const rawSendMessage = async (content: string, cid: string = useConversationStore.getState().currentConversationId) => {
      if (!checkToken() || !content.trim()) return;
      const { conversations } =
        useConversationStore.getState();
      if (
        !cid ||
        !conversations.some((c) => c.id === cid)
      )
        return;

      try {
        const userTempId = getTempId();
        const aiTempId = getTempId();

        updateMessages(cid, (msgs) => {
          if (get().loading) return msgs;
          return [
            ...msgs,
            { id: userTempId, content, role: "user" },
            { id: aiTempId, content: "", role: "assistant" },
          ];
        });

        setLoading(cid, true);
        const response = await chatAPI.sendMessage(
          cid,
          content
        );
        await handleStream(response, cid, {
          user: userTempId,
          ai: aiTempId,
        });
      } finally {
        setLoading(cid, false);
        const messages = await get().getMessages(cid);
        if(messages[messages.length -1].content.includes("真实结局")){
          functionalToast("提示：输入\"开始\"以进入下一阶段","MESSAGE",5000);
        }
      }
    };

    return {
      messages: [],
      messageCache: {},
      loading: false,

      getMessages: async (id) => {
        if (!checkToken()) return [];
        if (get().messageCache[id]) return get().messageCache[id];
        const response = await chatAPI.getMessages(id);
        if (!response) throw new Error("Invalid response");
        set((state) => ({
          messageCache: { ...state.messageCache, [id]: response },
        }));
        return response;

      },
      sendMessage: withTimeWindow(rawSendMessage, 1000),
      regenerateMessage: withTimeWindow(rawRegenerateMessage, 1000),

    };
  }));
