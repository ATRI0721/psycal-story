import { useState } from "react";
import { Avatar } from "../Avatar";
import { SidebarStory } from "./SidebarStory";
import { NewStoryButton } from "./NewStoryButton";
import { storyService } from "../../../services/storyService";
import { useSnapshot } from "valtio";
import { storyGetters, storyState } from "../../../stores/storyStore";
import StoryTree from "./StoryTree";
import { uiState } from "../../../stores/uiStore";
import { useAuthStore } from "../../../stores/authStore";
import { UIMode, UserGroup } from "../../../types";
import functionalToast from "../Commend/Toast";

const Sidebar = () => {
  // const { storyUIState } = useSnapshot(uiState);
  const { storyList } = useSnapshot(storyState);
  const { currentStoryId } = useSnapshot(storyGetters);
  const user = useAuthStore((s) => s.user);
  const [isStoryList, setIsStoryList] = useState(true);

  const selectStory = storyService.loadStory;
  const deleteStory = storyService.deleteStory;
  const reNameStory = storyService.renameStory;

  // const showConversation =
  //   storyUIState[currentStoryId ?? ""]?.showConversation ?? false;

  return (
    <div className="bg-[#F9FBFF] flex flex-col p-3 dark:bg-base-200 h-full w-full min-w-64">
      {/* Logo 区域 */}
      <div className="mt-4 mb-2 ml-3 flex justify-between">
        <div className="text-2xl font-bold w-fit">Psystory</div>
        <div
          className="cursor-pointer w-fit flex items-center tooltip tooltip-bottom hover-bg p-2"
          data-tip="收起侧边栏"
          onClick={() => (uiState.showSidebar = false)}
        >
          <img src="/left.svg" className="w-6 h-6" draggable="false" />
        </div>
      </div>

      <div className="my-4 ml-2 flex gap-1">
        <NewStoryButton />
        <button
          className="btn btn-soft btn-primary"
          onClick={() => setIsStoryList((b) => !b)}
        >
          {isStoryList ? "查看故事树" : "查看故事列表"}
        </button>
      </div>

      <div className="flex-1">
        {isStoryList ? (
          <div className="overflow-y-auto px-2">
            {storyList.map((s) => (
              <SidebarStory
                key={s.id}
                title={s.title}
                isSelected={s.id === currentStoryId}
                onSelectStory={() => selectStory(s.id)}
                onDeleteStory={() => deleteStory(s.id)}
                onRenameStory={(title: string) => reNameStory(s.id, title)}
              />
            ))}
          </div>
        ) : (
          <StoryTree />
        )}
      </div>
      {(user && user.group===UserGroup.ADMIN) && (
        <button className="btn btn-soft btn-primary"
        onClick={()=>{
          uiState.uiMode=uiState.uiMode===UIMode.CONTROL?UIMode.EXPERIMENT:UIMode.CONTROL;
          functionalToast(`当前模式${uiState.uiMode}`, "MESSAGE");
        }}>
          切换模式
        </button>
      )}
      {/* <button
        className="btn btn-soft btn-primary"
        onClick={() => {
          uiActions.getStoryUIState(currentStoryId ?? "").showConversation =
            !showConversation;
        }}
      >
        {showConversation ? "关闭对话" : "展开对话"}
      </button> */}
      <Avatar fold={false} />
    </div>
  );
};

export default Sidebar;
