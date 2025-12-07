import { MarkdownRender } from "./MarkdownRender";

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
