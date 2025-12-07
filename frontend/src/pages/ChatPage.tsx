import { useEffect } from "react";
import {
  ConvsationArea,
  StoryArea,
} from "../components/Chat/ChatArea";
import { Sidebar } from "../components/Chat/Sidebar";
import { storyState } from "../store/storyStore";
import { useSnapshot } from "valtio";
import { storyService } from "../services/storyService";
import { NewStoryButton } from "../components/Chat/NewStoryButton";
import { uiState } from "../store/uiStore";

export const ChatPage = () => {
  // ---- snap 整个 storyState（推荐） ----
  const { currentStoryMessage } = useSnapshot(storyState);
  const { storyUIState } = useSnapshot(uiState);
  const storyId = currentStoryMessage?.story_id??"";
  const showConversation = storyUIState[storyId]?.showConversation??false;
  useEffect(() => {
    storyService.fetchStories();
  }, []);

  return (
    <div className="h-screen flex">
      <Sidebar />
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
