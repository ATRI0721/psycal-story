import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { themeInitializer } from "./utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { isMobile } from "react-device-detect";
import mobileRouter from "./routes/MobileRoute";
import desktopRouter from "./routes/DesktopRoute";

const client = new QueryClient();

export default function App() {
  const router = useMemo(() => {
    return isMobile ? mobileRouter : desktopRouter;
  }, []);

  useEffect(() => {
    themeInitializer();
  }, []);

  return <QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>;
}

 