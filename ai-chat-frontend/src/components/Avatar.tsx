import { useAuthStore } from "../store/authStore";
import functionalDialog from "./Commend/SettingDialog";
import { Dropdown } from "./Dropdown";

export const Avatar = ({ fold }: { fold: boolean }) => {
  const logout = useAuthStore(s => s.logout);
  return (
    <Dropdown
      menuitems={[
        <li
          className="flex items-center p-2 button-like"
          onClick={functionalDialog}
          key={"1"}
        >
          <img src="/setting.svg" className="w-5 h-5 mr-2"></img>
          <div className="mx-2">系统设置</div>
        </li>,
        <li className="flex items-center p-2 button-like" key={"2"} onClick={logout}>
          <img src="/logout.svg" className="w-5 h-5 mr-2"></img>
          <div className="mx-2">退出登录</div>
        </li>,
      ]}
      top={true}
    >
      <div className="flex items-center cursor-pointer rounded-box p-2 hover:bg-[var(--hover-bg)]">
        <img src="/default_avatar.png" className="w-9 h-9"></img>
        <div>
          {fold || (
            <div className="ml-2 text-sm truncate select-none">个人信息</div>
          )}
        </div>
      </div>
    </Dropdown>
  );
};
