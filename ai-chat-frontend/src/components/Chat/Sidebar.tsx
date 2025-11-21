import { useState } from "react";
import { Avatar } from "../Avatar";
import { classifyConversations } from "../../utils";
import { SidebarConversation } from "./SidebarConversation";
import { NewConversationButton } from "./NewConversationButton";
// import { useChatStore } from "../../store/chatStore";
import { Conversation } from "../../types";
import { useConversationStore } from "../../store/conversationStore";

type Props = {
  onFold: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  conversations: Conversation[];
  selectedconversationId: string;
};


const UnfoldSidebar = ({
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  conversations,
  selectedconversationId,
  onFold,
}: Props) => {
  return (
    <div className="w-64 bg-[#F9FBFF] flex flex-col p-3 dark:bg-base-200">
      {/* Logo 区域 */}
      <div className="mt-4 mb-2 ml-3 flex justify-between">
        <div className="text-2xl font-bold w-fit">AI Chat</div>
        <div
          className="cursor-pointer w-fit flex items-center tooltip tooltip-bottom hover-bg p-2"
          data-tip="收起侧边栏"
          onClick={onFold}
        >
          <img src="/left.svg" className="w-6 h-6" draggable="false" />
        </div>
      </div>

      <div className="my-4 ml-2">
        <NewConversationButton size="large" />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-2">
        {classifyConversations(conversations).map((convs) => (
          <div key={convs.date_before} className="mb-6 relative">
            <div className="text-base font-bold sticky top-0 z-10 py-3">
              {convs.group_name}
            </div>
            <ul className="mt-1">
              {convs.conversations.map((conv) => (
                <SidebarConversation
                  key={conv.id}
                  title={conv.title}
                  isSelected={conv.id === selectedconversationId}
                  onSelectConversation={() => onSelectConversation(conv.id)}
                  onDeleteConversation={() => onDeleteConversation(conv.id)}
                  onRenameConversation={(title: string) =>
                    onRenameConversation(conv.id, title)
                  }
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Avatar fold={false} />
    </div>
  );
}

const FoldSidebar = ({
  onUnfold,
}:{onUnfold: () => void}) => {
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
}

export const Sidebar = () => {
  const [fold, setFold] = useState(false);

  const selectConversation = useConversationStore((state) => state.selectConversation);
  const deleteConversation = useConversationStore((state) => state.deleteConversation);
  const reNameConversation = useConversationStore((state) => state.reNameConversation);
  const conversations = useConversationStore((state) => state.conversations);
  const currentConversationId = useConversationStore((state) => state.currentConversationId);

  return (
    <>
      {fold ? (
        <FoldSidebar onUnfold={() => setFold(false)} />
      ) : (
        <UnfoldSidebar
          onFold={() => setFold(true)}
          conversations={conversations}
          selectedconversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onRenameConversation={reNameConversation}
        />
      )}
    </>
  );
};
