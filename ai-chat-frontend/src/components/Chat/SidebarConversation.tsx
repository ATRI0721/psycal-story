import { useState, useCallback, useEffect } from "react";
import classNames from "classnames";
import { Dropdown } from "../Dropdown";
import ClickOutsideWrapper from "../ClickOutsideWrapper";

type Props = {
  title: string;
  isSelected: boolean;
  onSelectConversation: () => void;
  onDeleteConversation: () => void;
  onRenameConversation: (newTitle: string) => void;
};

const commonHoverStyle: React.CSSProperties = {
  padding: "0.5rem",
  width: "fit-content",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  borderRadius: "0.5rem",
  gap: "0.75rem",
};

export const SidebarConversation = ({
  title,
  isSelected,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: Props) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tmpTitle, setTmpTitle] = useState(title);

  useEffect(() => {
    if (!isRenaming) {
      setTmpTitle(title);
    }
  }, [title, isRenaming]);

  const handleRenameTitle = useCallback(() => {
    setIsRenaming(false);
    const newTitle = tmpTitle.trim();
    if (newTitle && newTitle !== title) {
      onRenameConversation(newTitle);
    } else {
      setTmpTitle(title);
    }
  }, [tmpTitle, title, onRenameConversation]);

  const handleStartRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  }, []);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteConversation();
    },
    [onDeleteConversation]
  );

  return (
    <li>
      {isRenaming ? (
        <ClickOutsideWrapper
          onClickOutside={handleRenameTitle}
          onKeyDowns={["Escape", "Enter"]}
        >
          <input
            type="text"
            value={tmpTitle}
            onChange={(e) => setTmpTitle(e.target.value)}
            className="input input-bordered w-full max-w-xs"
            autoFocus
          />
        </ClickOutsideWrapper>
      ) : (
        <div
          className={classNames(
            "p-2 flex items-center justify-between group rounded-box cursor-pointer",
            isSelected
              ? "bg-[var(--conversations-bg)]"
              : "hover:bg-[var(--conversations-bg)]/30"
          )}
          onClick={onSelectConversation}
        >
          <div
            className="whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ width: "100%" }}
          >
            {tmpTitle}
          </div>
          <Dropdown
            menuitems={[
              <li
                key="rename"
                className="hover:bg-gray-100"
                style={commonHoverStyle}
                onClick={handleStartRename}
              >
                <img src="/pen.svg" className="w-6 h-6" draggable="false" />
                <div className="w-14">重命名</div>
              </li>,
              <li
                key="delete"
                className="hover:bg-red-100"
                style={commonHoverStyle}
                onClick={handleDelete}
              >
                <img src="/delete.svg" className="w-6 h-6" draggable="false" />
                <div className="w-14 text-red-500">删除</div>
              </li>,
            ]}
          >
            <img
              src="/dot.svg"
              className={classNames(
                "w-8 h-8 p-1 rounded-lg hover:bg-white group-hover:opacity-100",
                isSelected ? "opacity-100" : "opacity-0"
              )}
              draggable="false"
            />
          </Dropdown>
        </div>
      )}
    </li>
  );
};
