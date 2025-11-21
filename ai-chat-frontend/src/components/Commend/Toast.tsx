import { createRoot } from "react-dom/client";

type ToastType = "ERROR" | "MESSAGE" | "SUCCESS";

interface ToastProps {
  message: string;
  type: ToastType;
}

const Icon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case "ERROR":
      return <img src="./error.svg" className="w-5 h-5"></img>;
    case "MESSAGE":
      return <img src="./info.svg" className="w-5 h-5"></img>;
    case "SUCCESS":
      return <img src="./check.svg" className="w-5 h-5"></img>;
    default:
      return null;
  }
};

const Toast = ({ message, type }: ToastProps) => {
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 z-50 bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.2)] rounded-md">
      <Icon type={type} />
      <p className="text-md text-gray-900">{message}</p>
    </div>
  );
};

export default function functionalToast(message: string, type: ToastType, time: number = 2500) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Toast message={message} type={type} />);
  setTimeout(() => {
    root.unmount();
    document.body.removeChild(container);
  }, time);
}
