import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { RegisterForm } from "../components/Auth/RegisterForm";
import { LoginForm } from "../components/Auth/LoginForm";
import { Navigate } from "react-router-dom";


export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, user } = useAuthStore();

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

        {isLoading && (
          <div className="mt-4 text-center text-gray-500">加载中...</div>
        )}
      </div>
    </div>
  );
};
