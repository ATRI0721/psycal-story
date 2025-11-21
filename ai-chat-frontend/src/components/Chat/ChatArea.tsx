import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { NewConversationButton } from "./NewConversationButton";
import { useMessageStore } from "../../store/messageStore";
import { useConversationStore } from "../../store/conversationStore";



export const ChatArea = () => {
  const [input, setInput] = useState("");

  const messageListRef = useRef<HTMLDivElement>(null);

  const messages = useMessageStore((state) => state.messages);
  const loading = useMessageStore((state) => state.loading);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const currentConversationId = useConversationStore((state) => state.currentConversationId);
  const conversations = useConversationStore((state) => state.conversations);
  const conversation = conversations.find(c => c.id === currentConversationId);
  const createConversation = useConversationStore((state) => state.createConversation);
  const selectConversation = useConversationStore((state) => state.selectConversation);

  function handleScroll() {
    if (messageListRef.current) {
      messageListRef.current.scrollTo(0, messageListRef.current.scrollHeight);
    }
  }

  const handleSubmit = async (content: string) => {
    await createConversation();
    const cid = useConversationStore.getState().currentConversationId;
    await selectConversation(cid);
    await sendMessage(content, cid);
  };

  useEffect(() => {
    handleScroll();
  }, [messages]);


  return (
    <div className="flex-1 flex flex-col max-w-full">
      <div className="flex flex-col items-center justify-center relative">
        <div className="box-border pt-3 h-14 flex items-center justify-center">
          <div className="text-xl font-bold whitespace-nowrap text-ellipsis overflow-hidden h-10 flex-1 pt-2 rounded-xl max-w-3xl">
            {conversation?.title || "新对话"}
          </div>
          <div
            className="absolute top-full w-full h-8 z-10 pointer-events-none bg-gradient-to-b from-base-100/80 to-transparent"
          ></div>
        </div>
      </div>
      <div className="flex-1 relative">
        <div
          className="px-8 overflow-auto absolute top-0 bottom-0 left-0 right-0 min-h-full"
          ref={messageListRef}
        >
          <div className="flex flex-col h-full relative">
            <div className="max-w-3xl mx-auto w-full">
              <MessageList messages={messages} loading={loading} handleClick={setInput}/>
              {(loading || currentConversationId === "")?null:
              (<div className="flex items-center justify-center my-6">
                  <NewConversationButton size="small" />
                </div>)}
            </div>
            <div className="sticky bottom-0 mt-auto w-full flex items-center z-10 flex-col bg-base-100">
              <div className="relative w-full flex-1 max-w-3xl">
                <div className="absolute bottom-full right-3 h-8 w-8 p-1 border border-gray-400 rounded-full mb-5 cursor-pointer bg-base-100 z-10">
                  <img src="/arrow-down.svg" onClick={handleScroll} />
                </div>
                <ChatInput onSubmit={currentConversationId === ""?handleSubmit:sendMessage} input={input} handleInput={setInput}/>
              </div>
              <div className="my-1 text-xs text-gray-400">
                内容由AI生成，请仔细甄别{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
