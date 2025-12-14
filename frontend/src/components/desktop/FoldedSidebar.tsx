import { storyState } from "../../stores/storyStore";
import { uiState } from "../../stores/uiStore";
import { Avatar } from "../common/Avatar";

const FoldedSidebar = () => {
  return (
    <div className="w-16 bg-[#F9FBFF] flex flex-col items-center p-1 py-2 dark:bg-base-200">
      <div>
        <img
          src="logo.svg"
          className="w-12 h-12 cursor-pointer mt-2"
          onClick={() => (uiState.showSidebar = true)}
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
          onClick={() => (uiState.showSidebar = true)}
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
          onClick={() => (storyState.currentStoryMessage = null)}
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

export default FoldedSidebar;
