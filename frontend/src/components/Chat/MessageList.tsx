import { useState } from "react";
import functionalToast from "../Commend/Toast";
import { MarkdownRender } from "./MarkdownRender";

function Icons({
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
}: {
  onCopy: () => void;
  onRegenerate: () => void;
  onLike: () => void;
  onDislike: () => void;
}) {
  const iconStyle =
    "p-1 rounded-lg hover:bg-gray-200 cursor-pointer tooltip flex items-center justify-center";
  const [likeAnim, setLikeAnim] = useState(false);
  const [dislikeAnim, setDislikeAnim] = useState(false);

  const triggerAnim = (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    // 强制重置->下一帧触发，保证连续点击也能生效
    setter(false);
    requestAnimationFrame(() => {
      setter(true);
      // 动画时长比 config 中设定的略大一点以保险
      setTimeout(() => setter(false), 500);
    });
  };

  return (
    <div className="flex items-center mt-2 space-x-2">
      <div
        className={iconStyle}
        data-tip="复制"
        onClick={onCopy}
        draggable="false"
      >
        <img src="/copy.svg" className="w-5 h-5" draggable="false" />
      </div>

      <div
        className={iconStyle}
        style={{ padding: "0.375rem" }}
        data-tip="重新生成"
        onClick={onRegenerate}
        draggable="false"
      >
        <img src="/cycle.svg" className="w-4 h-4" draggable="false" />
      </div>

      <div
        className={iconStyle}
        data-tip="喜欢"
        onClick={() => {
          triggerAnim(setLikeAnim);
          onLike();
        }}
        draggable="false"
      >
        <img
          src="/like.svg"
          className={`w-5 h-5 transform inline-block ${
            likeAnim ? "animate-ping-once" : ""
          }`}
          draggable="false"
        />
      </div>

      <div
        className={iconStyle}
        data-tip="不喜欢"
        onClick={() => {
          triggerAnim(setDislikeAnim);
          onDislike();
        }}
        draggable="false"
      >
        <img
          src="/unlike.svg"
          className={`w-5 h-5 transform inline-block ${
            dislikeAnim ? "animate-ping-once" : ""
          }`}
          draggable="false"
        />
      </div>
    </div>
  );
}

export const MessageList = ({ messages, loading}: {messages: readonly { role:string, content: string }[], loading: boolean }) => {
  return (
    <div className="flex flex-col space-y-2 pt-9">
      {messages.map((message, index) => (
        <div key={index}>
          {message.role === "user" ? (
            <div className="flex justify-end my-6">
              <div className="px-4 py-2 w-fit bg-info/40 text-center text-base rounded-2xl">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="flex">
              {/* <div className="w-8 h-8 rounded-full border-1 border-gray-200 mr-2 p-0.5">
                <img src="/logo.svg"></img>
              </div> */}
              <div className="w-full">
                {loading && message.content === "" ? <div>正在生成中...</div> :<MarkdownRender content={message.content} disabled={index!==messages.length-1}/>}
                {/* {(loading && index === messages.length - 1) ? null : (
                  <Icons
                    onCopy={() =>
                      {
                        navigator.clipboard.writeText(message.content);
                        functionalToast("复制成功", "SUCCESS");
                      }
                    }
                    onRegenerate={() => {
                      functionalToast("功能尚未完成", "MESSAGE");
                    }}
                    onLike={() => {
                      functionalToast("点赞成功", "SUCCESS");
                    }}
                    onDislike={() => {
                      functionalToast("谢谢反馈", "MESSAGE");
                    }}
                  />
                )} */}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
