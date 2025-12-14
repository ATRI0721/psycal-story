import { useState } from "react";
import { SendCodeButton } from "./SendCodeButton";
import { useAuthStore } from "../../../stores/authStore";


export const RegisterForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const { register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ email, password, verification_code: code });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex">
        <input
          type="text"
          placeholder="验证码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 p-2 border rounded-md"
          required
        />
        <SendCodeButton email={email} type={"register"} />
      </div>

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

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:cursor-pointer"
      >
        注册
      </button>

      <div className="text-center text-sm text-gray-600">
        已有账号？{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 hover:underline"
        >
          立即登录
        </button>
      </div>
    </form>
  );
};
