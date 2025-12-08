import { useState } from "react";
import { Avatar } from "../Avatar";
import { SidebarStory } from "./SidebarStory";
import { NewStoryButton } from "./NewStoryButton";
import { storyService } from "../../services/storyService";
import { StorywithoutMessages } from "../../types";
import { useSnapshot } from "valtio";
import { storyGetters, storyState } from "../../store/storyStore";
import StoryTree from "./StoryTree";
import { uiActions, uiState } from "../../store/uiStore";

type Props = {
  onFold: () => void;
  onSelectStory: (id: string) => void;
  onDeleteStory: (id: string) => void;
  onRenameStory: (id: string, newTitle: string) => void;
  Storys: readonly StorywithoutMessages[];
  selectedStoryId: string;
};

const UnfoldSidebar = ({
  onSelectStory,
  onDeleteStory,
  onRenameStory,
  Storys,
  selectedStoryId,
  onFold,
}: Props) => {
  const [isStoryList, setIsStoryList] = useState(true);
  const { storyUIState } = useSnapshot(uiState);
  const showConversation = storyUIState[selectedStoryId]?.showConversation??false;
  return (
    <div className="w-64 bg-[#F9FBFF] flex flex-col p-3 dark:bg-base-200">
      {/* Logo 区域 */}
      <div className="mt-4 mb-2 ml-3 flex justify-between">
        <div className="text-2xl font-bold w-fit">Psycal Story</div>
        <div
          className="cursor-pointer w-fit flex items-center tooltip tooltip-bottom hover-bg p-2"
          data-tip="收起侧边栏"
          onClick={onFold}
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

      <div className="flex-1 h-full">
        {isStoryList ? (
          <div className="overflow-y-auto px-2">
            {Storys.map((conv) => (
              <SidebarStory
                key={conv.id}
                title={conv.title}
                isSelected={conv.id === selectedStoryId}
                onSelectStory={() => onSelectStory(conv.id)}
                onDeleteStory={() => onDeleteStory(conv.id)}
                onRenameStory={(title: string) => onRenameStory(conv.id, title)}
              />
            ))}
          </div>
        ) : (
          <StoryTree />
        )}
      </div>
      <button className="btn btn-soft btn-primary" disabled={true} onClick={()=>{uiActions.getStoryUIState(selectedStoryId).showConversation =
        !showConversation;}}>{showConversation?"关闭对话":"展开对话"}</button>
      <Avatar fold={false} />
    </div>
  );
};

const FoldSidebar = ({ onUnfold }: { onUnfold: () => void }) => {
  return (
    <div className="w-16 bg-[#F9FBFF] flex flex-col items-center p-1 py-2 dark:bg-base-200">
      <div>
        <img
          src="logo.svg"
          className="w-12 h-12 cursor-pointer mt-2"
          onClick={onUnfold}
          draggable="false"
        ></img>
      </div>
      <div
        className="mt-8 rounded-box hover:bg-base-200 p-1 tooltip tooltip-right"
        data-tip="展开侧边栏"
      >
        <img
          src="/right.svg"
          className="w-7 h-7 cursor-pointer"
          onClick={onUnfold}
          draggable="false"
        ></img>
      </div>
      <div
        className="mt-8 rounded-box hover:bg-base-200 p-1 tooltip tooltip-right"
        data-tip="开启新对话"
      >
        <img
          src="talk_gray.svg"
          className="w-7 h-7 cursor-pointer"
          onClick={() => {}}
          draggable="false"
        ></img>
      </div>
      <div className="flex-1"></div>
      <div className="pt-2">
        <Avatar fold={true} />
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [fold, setFold] = useState(false);

  const selectStory = storyService.loadStory;
  const deleteStory = storyService.deleteStory;
  const reNameStory = storyService.renameStory;
  const { storyList } = useSnapshot(storyState);
  const { currentStoryId } = useSnapshot(storyGetters);

  return (
    <>
      {fold ? (
        <FoldSidebar onUnfold={() => setFold(false)} />
      ) : (
        <UnfoldSidebar
          onFold={() => setFold(true)}
          Storys={storyList}
          selectedStoryId={currentStoryId ?? ""}
          onSelectStory={selectStory}
          onDeleteStory={deleteStory}
          onRenameStory={reNameStory}
        />
      )}
    </>
  );
};
