import { useEffect } from "react";
import {
  ConvsationArea,
  StoryArea,
} from "../../components/common/Chat/ChatArea";
import { storyState } from "../../stores/storyStore";
import { useSnapshot } from "valtio";
import { storyService } from "../../services/storyService";
import { NewStoryButton } from "../../components/common/Chat/NewStoryButton";
import { uiState } from "../../stores/uiStore";
import Sidebar from "../../components/common/Chat/Sidebar";
import Navbar from "../../components/mobile/Navbar";

export const ChatPage = () => {
  // ---- snap 整个 storyState（推荐） ----
  const { currentStoryMessage } = useSnapshot(storyState);
  const { storyUIState, showSidebar } = useSnapshot(uiState);
  const storyId = currentStoryMessage?.story_id ?? "";
  const showConversation = storyUIState[storyId]?.showConversation ?? false;
  useEffect(() => {
    storyService.fetchStories();
  }, []);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {showSidebar && <div className="h-full min-w-2/3"><Sidebar /></div>}
      <div className="flex-1 flex flex-col min-w-full">
        <Navbar />
        {currentStoryMessage ? (
          currentStoryMessage.stage === "initial" || showConversation ? 
            <ConvsationArea />:<StoryArea />
        ) : (
          <div className="flex flex-col flex-1 justify-center items-center">
            <div>点击按钮开始新故事</div>
            <NewStoryButton />
          </div>
        )}
      </div>
    </div>
  );
};
