import { useEffect } from "react";
import { ChatArea } from "../components/Chat/ChatArea";
import { ChatInput } from "../components/Chat/ChatInput";
import { Sidebar } from "../components/Chat/Sidebar";
import { useConversationStore } from "../store/conversationStore";



export const ChatPage = () => {
  const init = useConversationStore((state) => state.init);
  const isInit = useConversationStore((state) => state.isInit);
  const selectConversation = useConversationStore((state) => state.selectConversation);

    useEffect(() => {
      if (!isInit) init();
      selectConversation("");
    }, [init, isInit]);

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex">
          <ChatArea />
      </div>
    </div>
  );
};
