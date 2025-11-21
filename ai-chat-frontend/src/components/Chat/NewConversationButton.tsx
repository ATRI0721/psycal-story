import { useConversationStore } from "../../store/conversationStore";

export const NewConversationButton = ({
  size,
}: {
  size: "small" | "large";
}) => {
  const selectConversation = useConversationStore((state) => state.selectConversation);
  const baseClasses =
    "bg-[var(--button-bg)] rounded-xl hover:bg-[#C6DCF8] cursor-pointer flex items-center justify-evenly text-[#4D6BFE] dark:text-[#DBEAFE] dark:hover:bg-[#3D5AFE]";
  const sizeClasses =
    size === "small" ? "text-base w-32 px-1 py-1" : "text-lg w-36 p-2";
  return (
    <button onClick={() => {}} className={`${baseClasses} ${sizeClasses}`}>
      <img
        src="/talk.png"
        className={`${size === "small" ? "h-4 w-4" : "h-6 w-6"}`}
        draggable="false"
      />
      <div className="text-center" onClick={() => selectConversation("")}>
        开启新对话
      </div>
    </button>
  );
};
