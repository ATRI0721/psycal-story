import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { RegisterForm } from "../../components/common/Auth/RegisterForm";
import { LoginForm } from "../../components/common/Auth/LoginForm";
import { Navigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import { uiState } from "../../stores/uiStore";


export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuthStore();
  const { loading } = useSnapshot(uiState);

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-base-100 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-base-content/80">
          {isLogin ? "登录" : "注册"}
        </h1>

        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitch={() => setIsLogin(true)} />
        )}

        {loading && (
          <div
            className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
            role="status"
          ></div>
        )}
      </div>
    </div>
  );
};
