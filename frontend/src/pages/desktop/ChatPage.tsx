import { useEffect } from "react";
import {
  ConvsationArea,
  StoryArea,
} from "../../components/common/Chat/ChatArea";
import { storyState } from "../../stores/storyStore";
import { useSnapshot } from "valtio";
import { storyService } from "../../services/storyService";
import { NewStoryButton } from "../../components/common/Chat/NewStoryButton"
import { uiState } from "../../stores/uiStore";
import Sidebar from "../../components/common/Chat/Sidebar";
import FoldedSidebar from "../../components/desktop/FoldedSidebar";
import { UIMode } from "../../types";

export const ChatPage = () => {
  // ---- snap 整个 storyState（推荐） ----
  const { currentStoryMessage } = useSnapshot(storyState);
  const { storyUIState, showSidebar, uiMode } = useSnapshot(uiState);
  const storyId = currentStoryMessage?.story_id??"";
  const showConversation = (storyUIState[storyId]?.showConversation??false) && uiMode===UIMode.EXPERIMENT;
  useEffect(() => {
    storyService.fetchStories();
  }, []);

  return (
    <div className="h-screen flex">
      {showSidebar?<div className="w-64"><Sidebar /></div>:<FoldedSidebar />}
      <div className="flex-1 flex">
        {currentStoryMessage ? (
          currentStoryMessage.stage === "initial" ? (
            <ConvsationArea />
          ) : (
            <>
              <StoryArea />
              {showConversation && <ConvsationArea />}
            </>
          )
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
