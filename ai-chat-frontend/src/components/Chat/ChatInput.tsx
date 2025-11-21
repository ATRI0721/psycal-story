import { useState } from "react";

export const ChatInput = ({ onSubmit, input, handleInput, loading = false }: { 
  onSubmit: (text: string) => Promise<void>; 
  input: string;
  handleInput: (value: string) => void;
  loading?: boolean 
}) => {
 
  function handleSubmit(){
    if (input.trim() === "" || loading) {
      return;
    }
    onSubmit(input);
    handleInput("");
  }
  return (
    <div className="w-full bg-[var(--inputarea-bg)] rounded-3xl border-sky-100 border-2 dark:border-gray-600 max-w-3xl h-30">
      <div className="flex flex-col p-3">
        <div className="w-full ml-1 mr-1 max-h-20 relative">
          <textarea
            placeholder="给ai发送消息"
            className="absolute w-full resize-none bg-transparent block top-0 left-0 right-0 bottom-0 border-none focus:outline-none leading-7"
            value={input}
            onChange={(e) => {
              handleInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey === false) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          ></textarea>
          <div className="min-h-14 invisible pointer-events-none"></div>
        </div>
        <div className="flex items-center mt-1 justify-end">
          <div className="p-1 cursor-pointer hover:bg-gray-200 rounded-lg">
            <img
              src="/paperclip.svg"
              className="w-6 h-6"
              draggable="false"
            ></img>
          </div>
          <button
            className={`ml-4 p-1 rounded-full ${
              input.trim() === ""
                ? "cursor-not-allowed tooltip bg-sky-200 dark:bg-gray-500"
                : "bg-blue-600 cursor-pointer hover:bg-blue-700"
            }`}
            data-tip="请先输入消息内容"
            disabled={input.trim() === "" || loading}
            onClick={handleSubmit}
          >
            <img src="/arrow-up.svg" className="w-6 h-6 mix-blend-screen"></img>
          </button>
        </div>
      </div>
    </div>
  );
};
