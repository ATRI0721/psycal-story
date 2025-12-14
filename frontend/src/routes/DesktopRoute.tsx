import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./AuthGuardRoute";
import { AuthPage } from "../pages/common/AuthPage";
import { ChatPage } from "../pages/desktop/ChatPage";

const desktopRouter = createBrowserRouter([
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

export default desktopRouter;