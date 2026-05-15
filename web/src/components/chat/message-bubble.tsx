"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, FileText, Loader2, CircleCheck, ChevronDown, Clock, X } from "lucide-react";
import type { ChatMessage, ToolCall } from "@/hooks/useChatStream";

/* ============================================================
   Code Block with copy button + language label
   ============================================================ */
function CodeBlock({ children, className, ...props }: React.ComponentProps<"code">) {
  const [copied, setCopied] = useState(false);

  // Extract language from rehype-highlight class (language-xxx)
  const lang = className?.match(/language-(\w+)/)?.[1];

  const handleCopy = useCallback(async () => {
    const text = extractText(children);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [children]);

  return (
    <div className="group relative my-3">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border/50 bg-muted/80 px-4 py-1.5">
        <span className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.65rem] text-muted-foreground/60
                     opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              复制
            </>
          )}
        </button>
      </div>
      <pre className="my-0 rounded-t-none!">
        <code className={cn(className, "whitespace-pre-wrap! break-words!")} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

/** Extract plain text from React children for clipboard */
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as React.ReactElement).props.children);
  }
  return "";
}

/** Inline code (not inside a pre block) */
function InlineCode({ children, className, ...props }: React.ComponentProps<"code">) {
  // If className has language-xxx, it's a fenced code block — CodeBlock handles it
  if (className?.includes("language-")) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
  return (
    <code className="rounded bg-black/6 px-1.5 py-0.5 text-[0.82em] font-mono" {...props}>
      {children}
    </code>
  );
}

type MarkdownComponents = Parameters<typeof Markdown>[0]["components"];

const markdownComponents: MarkdownComponents = {
  code: ({ children, className, ...props }: any) => {
    if (className?.includes("language-")) {
      // Fenced code block — CodeBlock wraps <pre> so just pass through
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return <InlineCode>{children}</InlineCode>;
  },
  pre: ({ children, ...props }: any) => {
    // If the child <code> has a language class, wrap in CodeBlock
    const codeChild = children as React.ReactElement | undefined;
    if (codeChild?.props?.className?.includes("language-")) {
      return <CodeBlock {...codeChild.props} />;
    }
    return <pre className="my-3 overflow-x-auto rounded-lg border border-border/50 bg-muted p-4 text-[0.8rem] leading-relaxed" {...props}>{children}</pre>;
  },
  a: ({ href, children, ...props }: any) => (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined}
       rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} {...props}>
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt || "image"} className="max-w-full rounded-lg my-2"
         loading="lazy" {...props} />
  ),
};

/* ============================================================
   Markdown content renderer
   ============================================================ */
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="message-content prose-sm max-w-none break-words
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
}

/* ============================================================
   Thinking dots animation (streaming placeholder)
   ============================================================ */
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5 h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

/* ============================================================
   Message action bar (copy message, like, dislike)
   ============================================================ */
function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = content;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.7rem] text-muted-foreground/40
                   hover:text-foreground hover:bg-muted/60 transition-colors"
        title="复制消息"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        {copied ? "已复制" : "复制"}
      </button>

      <button
        onClick={() => setFeedback(feedback === "up" ? null : "up")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.7rem] transition-colors",
          feedback === "up"
            ? "text-green-600 bg-green-50"
            : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/60"
        )}
        title="有帮助"
      >
        <ThumbsUp className={cn("h-3 w-3", feedback === "up" && "fill-green-500")} />
      </button>

      <button
        onClick={() => setFeedback(feedback === "down" ? null : "down")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.7rem] transition-colors",
          feedback === "down"
            ? "text-red-600 bg-red-50"
            : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/60"
        )}
        title="没有帮助"
      >
        <ThumbsDown className={cn("h-3 w-3", feedback === "down" && "fill-red-500")} />
      </button>
    </div>
  );
}

/* ============================================================
   Tool call cards — collapsed chips + right-side detail drawer
   ============================================================ */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/** Pretty-print a JSON string or return as-is */
function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/* ── Right-side detail drawer ── */
function ToolDrawer({
  toolCall,
  index,
  durationStr,
  onClose,
}: {
  toolCall: ToolCall;
  index: number;
  durationStr: string;
  onClose: () => void;
}) {
  const isRunning = toolCall.status === "running";
  const emoji = toolCall.emoji || "⚡";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full animate-[tool-drawer-in_0.25s_ease-out] bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30 shrink-0">
          <span className="flex items-center justify-center h-6 w-6 rounded-md bg-muted text-[0.65rem] font-bold text-muted-foreground font-mono">
            {index}
          </span>
          <span className="text-lg leading-none">{emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{toolCall.label || toolCall.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  "text-[0.6rem] font-medium uppercase tracking-wider rounded-full px-1.5 py-0.5",
                  isRunning
                    ? "bg-primary/10 text-primary/70"
                    : "bg-emerald-100/80 text-emerald-600"
                )}
              >
                {isRunning ? "执行中" : "已完成"}
              </span>
              <span className="text-[0.6rem] text-muted-foreground/50">{toolCall.name}</span>
              {durationStr && (
                <span className="inline-flex items-center gap-0.5 text-[0.6rem] text-muted-foreground/40">
                  <Clock className="h-2.5 w-2.5" />
                  {durationStr}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Arguments */}
          {toolCall.arguments && (
            <section>
              <h4 className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                调用参数
              </h4>
              <pre className="rounded-xl bg-muted/40 border border-border/30 p-3.5 text-[0.72rem] leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap break-all text-foreground/75">
                {prettyJson(toolCall.arguments)}
              </pre>
            </section>
          )}

          {/* Result */}
          {toolCall.result && (
            <section>
              <h4 className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                执行结果
              </h4>
              <pre className="rounded-xl bg-muted/40 border border-border/30 p-3.5 text-[0.72rem] leading-relaxed overflow-x-auto max-h-80 overflow-y-auto font-mono whitespace-pre-wrap break-all text-foreground/75">
                {toolCall.result}
              </pre>
            </section>
          )}

          {/* Meta */}
          <section className="border-t border-border/20 pt-3">
            <dl className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <dt className="text-muted-foreground/50 shrink-0">Tool ID</dt>
                <dd className="font-mono text-muted-foreground/60 truncate">{toolCall.id}</dd>
              </div>
              {durationStr && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground/50 shrink-0">耗时</dt>
                  <dd className="text-muted-foreground/70">{durationStr}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Collapsed tool chip ── */
function ToolCallCard({
  toolCall,
  index,
  elapsed,
  durationStr,
  onClick,
}: {
  toolCall: ToolCall;
  index: number;
  elapsed: number;
  durationStr: string;
  onClick: () => void;
}) {
  const isRunning = toolCall.status === "running";
  const isDone = toolCall.status === "done";
  const emoji = toolCall.emoji || "⚡";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer select-none rounded-xl transition-all duration-300",
        isRunning && "tool-running-glow",
        isDone && "bg-muted/30 hover:bg-muted/50 hover:shadow-md",
        !isRunning && !isDone && "bg-muted/20"
      )}
    >
      {/* Animated gradient border (running) */}
      {isRunning && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, oklch(0.55 0.18 255 / 0.5), oklch(0.6 0.2 200 / 0.25), oklch(0.7 0.15 280 / 0.25), oklch(0.55 0.18 255 / 0.5))",
            backgroundSize: "300% 300%",
            animation: "tool-shimmer 3s linear infinite",
            padding: "1.5px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      )}

      {/* Static border (done) */}
      {isDone && (
        <div className="absolute inset-0 rounded-xl border border-border/40 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative px-3 py-2 flex items-center gap-2.5">
        {/* Sequence number */}
        <span
          className={cn(
            "flex items-center justify-center h-5 w-5 rounded-md shrink-0 text-[0.6rem] font-bold font-mono transition-colors",
            isRunning && "bg-primary/10 text-primary/60",
            isDone && "bg-muted-foreground/8 text-muted-foreground/50"
          )}
        >
          {index}
        </span>

        {/* Status icon */}
        <div
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded-md shrink-0 transition-all duration-500",
            isRunning && "bg-primary/10 text-primary",
            isDone && "bg-emerald-100/80 text-emerald-600"
          )}
        >
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CircleCheck className="h-3 w-3" />
          )}
        </div>

        {/* Emoji + label */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="text-sm leading-none shrink-0">{emoji}</span>
          <span
            className={cn(
              "text-xs font-medium truncate",
              isRunning ? "text-foreground/80" : "text-foreground/60"
            )}
          >
            {toolCall.label || toolCall.name}
          </span>
        </div>

        {/* Duration */}
        {elapsed > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[0.6rem] text-muted-foreground/40 shrink-0">
            <Clock className="h-2.5 w-2.5" />
            {durationStr}
          </span>
        )}

        {/* Click hint */}
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors -rotate-90" />
      </div>
    </div>
  );
}

/* ── Per-card wrapper (owns elapsed timer hook) ── */
function ToolCallItem({
  toolCall,
  index,
  onSelect,
  onElapsed,
}: {
  toolCall: ToolCall;
  index: number;
  onSelect: () => void;
  onElapsed: (ms: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = toolCall.startedAt;

  useEffect(() => {
    if (toolCall.status === "running" && startedAt) {
      const tick = () => {
        const ms = Date.now() - startedAt;
        setElapsed(ms);
      };
      tick();
      intervalRef.current = setInterval(tick, 200);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    if (toolCall.status === "done" && startedAt) {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
    }
  }, [toolCall.status, startedAt]);

  // Report elapsed to parent for drawer
  useEffect(() => {
    onElapsed(elapsed);
  }, [elapsed, onElapsed]);

  return (
    <ToolCallCard
      toolCall={toolCall}
      index={index}
      elapsed={elapsed}
      durationStr={formatDuration(elapsed)}
      onClick={onSelect}
    />
  );
}

/* ── Tool call list with auto-collapse + drawer ── */
function ToolCallList({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const prevAllDone = useRef(false);
  const elapsedRef = useRef<Map<string, number>>(new Map());
  const [refresh, setRefresh] = useState(0);

  const running = toolCalls.filter((tc) => tc.status === "running");
  const done = toolCalls.filter((tc) => tc.status === "done");
  const allDone = running.length === 0 && toolCalls.length > 0;

  // Track elapsed for each tool (reported from ToolCallItem children)
  const handleElapsed = useCallback((id: string, ms: number) => {
    elapsedRef.current.set(id, ms);
  }, []);

  // Periodic refresh for drawer duration labels
  useEffect(() => {
    if (running.length === 0) return;
    const id = setInterval(() => setRefresh((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [running.length]);

  // Auto-collapse when all tools complete
  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      const timer = setTimeout(() => setCollapsed(true), 800);
      prevAllDone.current = true;
      return () => clearTimeout(timer);
    }
    if (!allDone) {
      prevAllDone.current = false;
      setCollapsed(false);
    }
  }, [allDone]);

  if (!toolCalls || toolCalls.length === 0) return null;

  const ordered = [...running, ...done];
  const selectedTool = selectedIndex !== null ? ordered[selectedIndex] : null;

  // Get the elapsed for the selected tool from the ref
  const selectedElapsed = selectedTool
    ? elapsedRef.current.get(selectedTool.id) ?? 0
    : 0;

  return (
    <div className="mb-2.5">
      {/* Collapsed summary bar (shown when auto-collapsed) */}
      {collapsed && allDone && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center gap-2 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/30 px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-all duration-300"
        >
          <CircleCheck className="h-3 w-3 text-emerald-500" />
          <span>{toolCalls.length} 个工具已执行完成</span>
          <ChevronDown className="h-3 w-3 ml-auto transition-transform duration-300" />
        </button>
      )}

      {/* Expanded tool list */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          collapsed && allDone ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1.5">
            {ordered.map((tc, i) => (
              <ToolCallItem
                key={tc.id}
                toolCall={tc}
                index={toolCalls.indexOf(tc) + 1}
                onSelect={() => setSelectedIndex(i)}
                onElapsed={(ms) => handleElapsed(tc.id, ms)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selectedTool && (
        <ToolDrawer
          toolCall={selectedTool}
          index={toolCalls.indexOf(selectedTool) + 1}
          durationStr={formatDuration(selectedElapsed)}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   Main MessageBubble
   ============================================================ */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;

  return (
    <div
      className={cn(
        "flex gap-3 group animate-message-enter",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5",
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-muted text-foreground/70"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Bubble + Actions */}
      <div
        className={cn(
          "max-w-[78%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Image attachments preview */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5 justify-end">
            {message.attachments.filter((a) => a.type === "image").map((att) => (
              <img
                key={att.id}
                src={att.data}
                alt={att.name}
                className="max-h-40 max-w-48 rounded-lg border border-border/30 object-cover"
              />
            ))}
            {message.attachments.filter((a) => a.type === "text").map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1 rounded-md bg-white/50 border border-border/30 px-2 py-1 text-xs"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-32 truncate text-muted-foreground">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-2xl rounded-br-md bg-primary/8 text-foreground"
              : "rounded-2xl rounded-bl-md glass-panel-subtle text-foreground",
            isStreaming && "min-w-20"
          )}
        >
          {/* Tool calls — shown inside assistant bubble above content */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <ToolCallList toolCalls={message.toolCalls} />
          )}

          {message.content ? (
            <MarkdownContent content={message.content} />
          ) : isStreaming ? (
            <span className="text-muted-foreground">
              <ThinkingDots />
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">空响应</span>
          )}
        </div>

        {/* Actions — only show for assistant messages with content */}
        {!isUser && message.content && !isStreaming && (
          <MessageActions content={message.content} />
        )}
      </div>
    </div>
  );
}
