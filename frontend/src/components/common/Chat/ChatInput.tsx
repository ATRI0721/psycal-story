import { useState, useEffect, useRef, useLayoutEffect } from "react";

export const ChatInput = ({
  onSubmit,
  input,
  handleInput,
  loading = false,
}: {
  onSubmit: (text: string) => Promise<void>;
  input: string;
  handleInput: (value: string) => void;
  loading?: boolean;
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const [text, setText] = useState(input);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(input);
  }, [input]);

  // ⭐ 自动高度，最多 6 行
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const lineHeight = 28; // 对应 leading-7
    const maxHeight = lineHeight * 6;

    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [text]);

  function handleSubmit() {
    if (input.trim() === "" || loading) return;
    onSubmit(input);
    handleInput("");
  }

  return (
    <div className="w-full bg-[var(--inputarea-bg)] rounded-3xl max-w-3xl">
      <div className="flex flex-col p-3">
        <textarea
          ref={textareaRef}
          placeholder="给ai发送消息"
          className="
            w-full resize-none bg-transparent
            border-none focus:outline-none
            leading-7 overflow-hidden
          "
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!isComposing) handleInput(e.target.value);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            handleInput(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isComposing) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex items-center mt-2 justify-end">
          <button
            disabled={input.trim() === "" || loading}
            onClick={handleSubmit}
            className={`ml-4 p-1 rounded-full ${
              input.trim() === ""
                ? "cursor-not-allowed bg-sky-200"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <img src="/arrow-up.svg" className="w-6 h-6 mix-blend-screen" />
          </button>
        </div>
      </div>
    </div>
  );
};
