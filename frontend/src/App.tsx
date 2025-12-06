import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { themeInitializer } from "./utils";
import { ChatPage } from "./pages/ChatPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to='/' />
  }
]);

export const client = new QueryClient();

export default function App() { 
  useEffect(() => {
    themeInitializer();
  }, []);

  return <QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>;
}
 