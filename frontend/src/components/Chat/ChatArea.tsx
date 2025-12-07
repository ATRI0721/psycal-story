import { useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { useSnapshot } from "valtio";
import { storyGetters, storyState } from "../../store/storyStore";
import { LogicErrorBoundary } from "../LogicErrorBoundary";
import { storyService } from "../../services/storyService";
import { uiActions, uiState } from "../../store/uiStore";
import functionalToast from "../Commend/Toast";

export const ChatArea = ({
  title,
  onSubmit,
  messages,
  loading,
  input,
  setInput,
}: {
  title: string;
  onSubmit: (text: string) => Promise<void>;
  messages: readonly { role: string; content: string }[];
  loading: boolean;
  input: string;
  setInput: (s: string) => void;
}) => {
  const messageListRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    if (messageListRef.current) {
      messageListRef.current.scrollTo(0, messageListRef.current.scrollHeight);
    }
  }

  useEffect(() => {
    handleScroll();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col max-w-full">
      <div className="flex flex-col items-center justify-center relative">
        <div className="box-border pt-3 h-14 flex items-center justify-center">
          <div className="text-xl font-bold whitespace-nowrap text-ellipsis overflow-hidden h-10 flex-1 pt-2 rounded-xl max-w-3xl">
            {title}
          </div>
          <div className="absolute top-full w-full h-8 z-10 pointer-events-none bg-gradient-to-b from-base-100/80 to-transparent"></div>
        </div>
      </div>
      <div className="flex-1 relative">
        <div
          className="px-8 overflow-y-auto overflow-x-hidden absolute top-0 bottom-0 left-0 right-0 min-h-full"
          ref={messageListRef}
        >
          <div className="flex flex-col h-full relative">
            <div className="max-w-3xl mx-auto w-full">
              <MessageList messages={messages} loading={loading} />
            </div>
            <div className="sticky bottom-0 mt-auto w-full flex items-center z-10 flex-col bg-base-100">
              <div className="relative w-full flex-1 max-w-3xl">
                <div className="absolute bottom-full right-3 h-8 w-8 p-1 border border-gray-400 rounded-full mb-5 cursor-pointer bg-base-100 z-10">
                  <img src="/arrow-down.svg" onClick={handleScroll} />
                </div>
                <ChatInput
                  onSubmit={onSubmit}
                  input={input}
                  handleInput={setInput}
                />
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

export const ConvsationArea = () => {
  const { currentStoryMessage } = useSnapshot(storyState);
  const { conversationUIState } = useSnapshot(uiState);
  const conversation = currentStoryMessage?.conversation;
  const sendMessageToConversation = storyService.sendMessageToConversation;
  const state = conversationUIState[currentStoryMessage?.id ?? ''] || { loading: false, input: "" };
  return conversation ? (
    <ChatArea
      title={conversation.title}
      onSubmit={sendMessageToConversation}
      messages={conversation.messages}
      loading={state.loading}
      input={state.input}
      setInput={(s) => uiActions.getConversationUIState(currentStoryMessage.id).input=s}
    />
  ) : (
    <LogicErrorBoundary errorMessage="ConversationArea" />
  );
};

export const StoryArea = () => {
  const { currentStoryMessage, storyList } = useSnapshot(storyState);
  const { storyUIState } = useSnapshot(uiState);
  const storyBranchMessages = useSnapshot(storyGetters).storyBranchMessages;
  const sendMessageToBranch = storyService.sendMessageToBranch;
  const id = currentStoryMessage?.story_id ?? "";
  const currentStory = storyList.find(
    (s) => id == s.id
  );
  const state = storyUIState[id] || { loading: false, input: "" };
  const handleSubmit = async (s: string) => {
    if (currentStoryMessage?.stage === "completed") {
      functionalToast("当前故事已结束", "MESSAGE", 5000);
      return;
    }
    return sendMessageToBranch(s);
  };
  return (
    currentStoryMessage && currentStory ? <ChatArea
      title={currentStory.title}
      onSubmit={handleSubmit}
      messages={storyBranchMessages.slice(1)}
      loading={state.loading}
      input={state.input}
      setInput={(s) => uiActions.getStoryUIState(id).input=s}
    /> : <LogicErrorBoundary errorMessage="StoryArea"/>
  );
};
