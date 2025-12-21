import { useState } from "react";
import { SendCodeButton } from "./SendCodeButton";
import { useAuthStore } from "../../../stores/authStore";
import { LoginCodeRequest, LoginPasswordRequest} from "../../../types";
import { useSnapshot } from "valtio";
import { uiState } from "../../../stores/uiStore";

type LoginType = "code" | "password";

export const LoginForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loginType, setLoginType] = useState<LoginType>("password");
  const login = useAuthStore(s => s.login);
  const loading = useSnapshot(uiState).loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials =
      loginType === "password"
        ? ({ email, password } as LoginPasswordRequest)
        : ({ email, verification_code:code } as LoginCodeRequest);
    await login(credentials);
  };

  const loginButtonClasses = (currentType: string, type: string) =>
    `flex-1 py-2 rounded-md ${
      currentType === type
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-600 hover:cursor-pointer hover:bg-gray-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setLoginType("password")}
          className={loginButtonClasses(loginType, "password")}
        >
          密码登录
        </button>
        <button
          type="button"
          onClick={() => setLoginType("code")}
          className={loginButtonClasses(loginType, "code")}
        >
          验证码登录
        </button>
      </div>

      <div>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      {loginType === "password" ? (
        <div>
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
      ) : (
        <div className="flex">
          <input
            type="text"
            placeholder="验证码"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-2 border rounded-md"
            required
          />
          <SendCodeButton email={email} type={"login"} />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 btn btn-primary text-lg"
      >
        登录
      </button>

      <div className="text-center text-sm text-gray-600">
        没有账号？{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 hover:underline hover:cursor-pointer"
        >
          立即注册
        </button>
      </div>
    </form>
  );
};
