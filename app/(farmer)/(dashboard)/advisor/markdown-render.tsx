"use client";

import Markdown from "react-markdown";

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownRender({ text, className = "" }: Props) {
  return (
    <div className={`prose prose-sm prose-agro max-w-none ${className}`}>
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 ps-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 ps-5 last:mb-0">{children}</ol>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          h1: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-semibold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-1 mt-2 text-base font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>
          ),
          code: ({ children }) => (
            <code className="rounded bg-agro-mint/30 px-1 py-0.5 font-mono text-xs">
              {children}
            </code>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
