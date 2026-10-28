import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Children, isValidElement, type ReactNode } from "react";
import { headingId } from "@/lib/posts";

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : isValidElement<{ children?: ReactNode }>(c) ? textOf(c.props.children) : ""))
    .join("");
}

const components: Components = {
  h1: ({ children }) => <h2 id={headingId(textOf(children))} className="mt-12 scroll-mt-28 text-[1.75rem] font-bold leading-tight tracking-[-0.025em]">{children}</h2>,
  h2: ({ children }) => <h2 id={headingId(textOf(children))} className="mt-12 scroll-mt-28 text-[1.75rem] font-bold leading-tight tracking-[-0.025em]">{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(textOf(children))} className="mt-9 scroll-mt-28 text-xl font-bold tracking-[-0.015em]">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-7 text-lg font-semibold">{children}</h4>,
  p: ({ children }) => <p className="mt-5 text-[1.0625rem] leading-[1.8] text-ink/85">{children}</p>,
  ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 text-[1.0625rem] leading-[1.75] text-ink/85 marker:text-brand">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 text-[1.0625rem] leading-[1.75] text-ink/85 marker:font-semibold">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="mt-6 border-l-4 border-brand bg-mist px-5 py-1 text-ink/80 [&>p]:mt-3 [&>p:last-child]:mb-3">{children}</blockquote>,
  hr: () => <hr className="my-10 border-silver" />,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-mist px-1.5 py-0.5 text-[0.9em]">{children}</code>,
  pre: ({ children }) => <pre className="mt-5 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-white [&_code]:bg-transparent [&_code]:p-0">{children}</pre>,
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-xl border border-silver">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-mist">{children}</thead>,
  th: ({ children }) => <th className="border-b border-silver p-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-silver p-3 align-top">{children}</td>,
  a: ({ href = "", children }) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} className="font-medium text-brand underline underline-offset-4 hover:text-brand-deep">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-4 hover:text-brand-deep">{children}</a>
    ),
  img: ({ src, alt, title }) =>
    typeof src === "string" && src ? (
      <span className="mt-6 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full rounded-2xl bg-mist" />
        {title || alt ? <span className="mt-2 block text-center text-sm text-steel">{title || alt}</span> : null}
      </span>
    ) : null,
};

/** Hiển thị Markdown an toàn: không render HTML thô, link nội bộ dùng next/link */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="[&>*:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
