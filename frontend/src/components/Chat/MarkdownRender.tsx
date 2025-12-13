import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { storyActions, storyGetters, storyState } from "../../store/storyStore";
import { uiActions } from "../../store/uiStore";
import { storyService } from "../../services/storyService";

const CodeBlock = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace(/language-/, "") || "text";
  const code = String(children).trim();

  const handleCopy = () => {
    if (copied) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <div
        className="bg-gray-600 flex justify-between text-sm px-2 py-1 "
        style={{ borderRadius: "0.75rem 0.75rem 0 0" }}
      >
        <div>{language}</div>
        <div onClick={handleCopy} className="cursor-pointer ">
          {copied ? "复制成功" : "复制"}
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ marginTop: "0px", borderRadius: "0 0 0.75rem 0.75rem" }}
        PreTag="div"
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-base-200 px-1.5 py-0.5 rounded">{children}</code>
);

function checkSelected(actionId: string, details: string = "") {
  if (actionId.startsWith("choice")) {
    const msg = storyState.currentStoryMessage;
    if (msg) {
      const storyMsgs = storyState.storyCache[msg.story_id].story_messages;
      const c1 = storyMsgs.find(
        (m) => m.content === details && m.parent_id === msg.id
      );
      if (c1) {
        const c2 = storyMsgs.find((m) => m.id === c1.children_id[0]);
        return c2;
      }
    }
  }
  return undefined;
}

function handleClick(actionId: string, details: string = "") {
  if (actionId.startsWith("choice")) {
    const c = checkSelected(actionId, details);
    if (c) {
      storyActions.selectStoryMessage(c);
      return;
    }
    const storyId = storyState.currentStoryMessage?.story_id ;
    if (storyId) uiActions.getStoryUIState(storyId).input = details;
  } else if (
    actionId.startsWith("scenario") ||
    actionId.startsWith("problem")
  ) {
    const storyMsgId = storyState.currentStoryMessage?.id;
    if (storyMsgId) uiActions.getConversationUIState(storyMsgId).input = details;
  } else if (actionId.startsWith("start-story")) {
    storyService.sendMessageToBranch("开始故事");
  }
}

function checkDisabled(actionId: string){
  if(actionId.startsWith("start-story")) {
    const story = storyGetters.currentStory;
    if(story && story.story_messages.length > 1){
      return true;
    }
  }
  return false;
};

export const MarkdownRender = ({
  content,
  disabled = true,
}: {
  content: string;
  disabled?: boolean;
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          return isInline ? (
            <InlineCode {...props}>{children}</InlineCode>
          ) : (
            <CodeBlock className={className} {...props}>
              {children}
            </CodeBlock>
          );
        },
        a: ({ href, children, ...props }) => {
          if (href?.startsWith("action:")) {
            const actionId = href.replace("action:", "");
            const style = checkSelected(actionId, children?.toString())?"btn-success btn":"bg-white";
            return (
              <button
                className={
                  "btn text-black border-[#e5e5e5] w-full my-1 " + style
                }
                disabled={disabled || checkDisabled(actionId)}
                onClick={() => {
                  handleClick(actionId, children?.toString());
                }}
              >
                {children}
              </button>
            );
          }
          return (
            <a {...props} href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
