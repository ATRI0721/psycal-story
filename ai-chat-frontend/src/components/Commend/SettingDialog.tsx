import { JSX, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getTheme, setTheme } from "../../utils";
import { useAuthStore } from "../../store/authStore";
import { useConversationStore } from "../../store/conversationStore";

function SettingItem({ children, text, bt=true }: { children: JSX.Element, text: string, bt?: boolean }){
    return (
        <div className="flex items-center justify-between w-full h-14"
        style={bt ? {borderTop: "1px solid #eee"}: {}}>
          <div className="leading-8">{text}</div>
          {children}
        </div>
    )
}

const GeneralSetting = () => {
  const [theme, setSelectedTheme] = useState(getTheme());
  useEffect(() => {
    setTheme(getTheme());
  }, []);

  return (
    <SettingItem text="主题" bt={false}>
      <select
        data-theme-select
        className="select select-primary w-fit cursor-pointer rounded-md"
        onChange={(e) => {
          setTheme(e.target.value);
          setSelectedTheme(e.target.value);
        }}
        value={theme}
      >
        <option value="system">
          跟随系统
        </option>
        <option value="light">
          浅色
        </option>
        <option value="dark">
          深色
        </option>
      </select>
    </SettingItem>
  );
};

const AccountSetting = () => {
  const user = useAuthStore(s => s.user);
  const deleteAllConversations = useConversationStore(s => s.deleteAllConversations);
  return (
    <div className="flex flex-col items-center w-full my-2">
      <SettingItem text="邮箱" bt={false}>
        <div className="text-gray-500">{user!.email}</div>
      </SettingItem>
      <SettingItem text={"删除所有对话"}>
        <div className="bg-red-500 rounded-lg px-2 py-1 cursor-pointer hover:bg-red-600"
          onClick={deleteAllConversations}>
          删除
        </div>
      </SettingItem>
    </div>
  );
};



const SettingDialog = ({ closeFunc }: { closeFunc: () => void }) => {
    const [form,setForm] = useState<0|1>(0);
    const selecterStyle = "rounded-lg p-0.5 text-center cursor-pointer"
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
          closeFunc();
        }
      }
      document.body.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.removeEventListener("keydown", handleKeyDown);
      };
    })
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
      // data-theme="dark"
      onClick={closeFunc}
    >
      <div
        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-base-100"
        style={{ width: "32rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <div className="text-xl font-bold">系统设置</div>
          <img
            src="closs.svg"
            className="p-1 w-6 h-6 button-like"
            onClick={closeFunc}
          ></img>
        </div>
        <div className="w-full grid grid-cols-2 bg-base-100 rounded-xl p-[0.25rem] h-10 my-4">
          <div
            className={`${selecterStyle} ${
              form === 0 && "bg-base-200 font-bold"
            }`}
            onClick={() => setForm(0)}
          >
            通用设置
          </div>
          <div
            className={`${selecterStyle} ${
              form === 1 && "bg-base-200 font-bold"
            }`}
            onClick={() => setForm(1)}
          >
            账户管理
          </div>
        </div>
        {form === 0 ? (
          <GeneralSetting />
        ) : form === 1 ? (
          <AccountSetting />
        ) : null}
      </div>
    </div>
  );
}; 

export default function functionalDialog() {
    const container = document.createElement("div");
    document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<SettingDialog closeFunc={() => {root.unmount();document.body.removeChild(container)}} />);
}

