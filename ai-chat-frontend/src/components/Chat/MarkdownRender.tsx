import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CodeBlock = ({ className, children }: { className: string; children: React.ReactNode }) => {
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
      <div className="bg-gray-600 flex justify-between text-sm px-2 py-1 "
        style={{ borderRadius: "0.75rem 0.75rem 0 0" }}>
        <div>{language}</div>
        <div
          onClick={handleCopy}
          className="cursor-pointer "
        >
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
  <code className="bg-base-200 px-1.5 py-0.5 rounded">
    {children}
  </code>
);

export const MarkdownRender = ({ content, handleClick, disabled = true }: { content: string, handleClick: (value: string)=>void, disabled?:boolean }) => {
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
            return (
              <button
                className="btn bg-white text-black border-[#e5e5e5] w-full my-1"
                disabled={disabled}
                onClick={() => {
                  handleClick(children.toString());
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
