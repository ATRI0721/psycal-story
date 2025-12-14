import { storyState } from "../../stores/storyStore";
import { uiActions, uiState } from "../../stores/uiStore";

const Navbar = () => {
  const ui = uiActions.getStoryUIState(
    storyState.currentStoryMessage?.story_id ?? ""
  );
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost" onClick={()=>uiState.showSidebar=true}>
          <img src="/menu.svg" className="w-5 h-5"></img>
        </button>
      </div>
      <div className="flex-1"></div>
      <div className="flex-none">
        <button className="btn btn-square btn-ghost" onClick={()=>ui.showConversation=!ui.showConversation}>
          <img src="/change.svg" className="w-5 h-5"></img>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
