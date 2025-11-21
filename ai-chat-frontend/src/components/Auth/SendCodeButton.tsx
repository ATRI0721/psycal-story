import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { SendVerificationRequest } from "../../types";
import { handleError } from "../../store/middleware";

// 倒计时 hook（浏览器环境）
function useCountdown(key: string, initial = 0) {
  const [countdown, setCountdown] = useState<number>(() => {
    const saved = localStorage.getItem(key);
    const deadline = saved ? parseInt(saved, 10) : 0;
    if (!deadline) return initial;

    const now = Date.now();
    const remaining = Math.max(Math.floor((deadline - now) / 1000), 0);
    return remaining;
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (countdown > 0 && timerRef.current === null) {
      timerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current !== null) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            localStorage.removeItem(key);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdown, key]);

  // 设置新的倒计时时，直接存 timestamp
  const startCountdown = (seconds: number) => {
    const deadline = Date.now() + seconds * 1000;
    localStorage.setItem(key, deadline.toString());
    setCountdown(seconds);
  };

  return [countdown, startCountdown] as const;
}

export const SendCodeButton = ({ email, type }: SendVerificationRequest) => {
  const [countdown, setCountdown] = useCountdown("countdown");
  const sendVerification = useAuthStore((s) => s.sendVerification);

  const handleSendCode = async () => {
    if (!email || countdown > 0) return;

    try {
      await sendVerification({ email, type });
      setCountdown(60);
    } catch (error) {
      handleError(new Error("验证码发送失败，请稍后重试"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleSendCode}
      disabled={countdown > 0}
      className="w-32 ml-2 px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-md 
                 disabled:bg-gray-100 disabled:text-gray-400"
    >
      {countdown > 0 ? `${countdown}s` : "发送验证码"}
    </button>
  );
};
