
import { useSnapshot } from "valtio";
import { storyState } from "../../stores/storyStore";
import { uiActions, uiState } from "../../stores/uiStore";
import { UIMode } from "../../types";


const Navbar = () => {
  const ui = uiActions.getStoryUIState(
    storyState.currentStoryMessage?.story_id ?? ""
  );
  const { uiMode } = useSnapshot(uiState);
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost" onClick={()=>uiState.showSidebar=true}>
          <img src="/menu.svg" className="w-5 h-5"></img>
        </button>
      </div>
      <div className="flex-1"></div>
      <div className="flex-none">
        <button className="btn btn-square btn-ghost" disabled={uiMode===UIMode.CONTROL} onClick={()=>ui.showConversation=!ui.showConversation}>
          <img src="/change.svg" className="w-5 h-5"></img>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
