import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function AuthGuardRoute() {
  const user = useAuthStore(s => s.user);
  const verifyToken = useAuthStore(s => s.verifyToken);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await verifyToken();
      setIsVerifying(false);
    };
    if (!user) checkAuth();
    else setIsVerifying(false);
  }, []);

  if (isVerifying) return <div className="w-full h-full skeleton"></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
