"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownRender({ text, className = "" }: Props) {
  return (
    <div className={`prose prose-sm prose-agro max-w-none ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 ps-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 ps-5 last:mb-0">{children}</ol>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1 mt-2 text-sm font-semibold">{children}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="mb-1 mt-2 text-sm font-semibold">{children}</h5>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-agro-forest/5 p-3 font-mono text-xs text-agro-ink">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-agro-mint/30 px-1 py-0.5 font-mono text-xs">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-agro-forest/5 p-0 last:mb-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-s-4 border-agro-canopy/40 ps-3 text-agro-slate italic last:mb-0">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-agro-canopy underline underline-offset-2 hover:text-agro-forest"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-3 border-agro-sprout" />,
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-agro-sprout bg-agro-mint/30">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-agro-sprout/50 last:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-agro-forest">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-agro-ink">{children}</td>
          ),
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-1 rounded border-agro-slate accent-agro-canopy"
              {...props}
            />
          ),
          li: ({ children, ordered }) => {
            if (ordered) {
              return <li className="mb-1">{children}</li>;
            }
            return <li className="mb-1">{children}</li>;
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
