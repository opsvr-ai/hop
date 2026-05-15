"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Bot, Search, ShieldAlert, Zap, PanelLeft, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_ACTIONS = [
  { icon: Search, label: "故障定界", desc: "分析系统异常并定位故障边界", prompt: "请帮我分析一下当前系统的异常情况，定位故障边界。" },
  { icon: ShieldAlert, label: "应急协同", desc: "启动应急流程并协调团队", prompt: "我需要启动应急协同流程，请协助我处理当前的紧急问题。" },
  { icon: Zap, label: "日常巡检", desc: "批量执行巡检任务", prompt: "请帮我执行一次完整的日常巡检任务。" },
];

interface SessionItem {
  id: string;
  source: string;
  title: string;
  started_at: number;
  message_count: number;
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return "";
  try {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin || 1}分钟前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}小时前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function ChatPage() {
  const { messages, isLoading, sendMessage, stop, clearMessages } = useChatStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/hermes/sessions?limit=30");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const showQuickActions = messages.length === 0;

  return (
    <div className="flex h-full dot-grid-surface">
      {/* Conversation history panel */}
      <div className={cn(
        "hidden lg:flex flex-col border-r border-border/40 bg-sidebar/60 transition-all duration-300",
        historyOpen ? "w-56" : "w-0 overflow-hidden border-r-0"
      )}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
          <span className="text-xs font-medium text-sidebar-foreground/70">对话历史</span>
          <button
            onClick={() => setHistoryOpen(false)}
            className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sessionsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-md w-full" />
            ))
          ) : sessions.length === 0 ? (
            <p className="text-[0.65rem] text-muted-foreground/50 text-center py-8">
              暂无对话历史
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                className="w-full text-left rounded-md px-2.5 py-2 text-xs transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group"
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <span className="truncate font-medium">
                    {s.title || "未命名对话"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 ml-4.5">
                  <span className="text-[0.6rem] text-muted-foreground/50">
                    {formatTime(s.started_at)}
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground/40">
                    {s.message_count}条
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Toggle button when collapsed */}
      {!historyOpen && (
        <button
          onClick={() => setHistoryOpen(true)}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-20 w-6 items-center justify-center rounded-r-lg border border-l-0 border-border/40 bg-sidebar/80 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <PanelLeft className="h-3.5 w-3.5 rotate-180" />
        </button>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-3">
            {showQuickActions && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-8 py-12 w-full max-w-lg">
                  <div className="space-y-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 mx-auto">
                      <Bot className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">
                      需要什么帮助？
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      向 Hermes Agent 提问，执行运维操作或分析问题
                    </p>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => sendMessage(action.prompt)}
                          className="glass-panel rounded-xl p-4 text-left transition-all
                                     hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                                     group cursor-pointer"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 mb-3 group-hover:bg-primary/12 transition-colors">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-sm font-medium text-foreground mb-1">{action.label}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">{action.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">智能运维对话</span>
                  </div>
                  <button
                    onClick={clearMessages}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    清空对话
                  </button>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className="animate-message-enter">
                    <MessageBubble message={msg} />
                  </div>
                ))}
                <div ref={scrollRef} />
              </>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
          <ChatInput onSend={sendMessage} onStop={stop} isLoading={isLoading} />
          <p className="text-center text-[0.65rem] text-muted-foreground/50 mt-2.5">
            Hermes Agent 可能产生不准确的信息，请验证重要事实。
          </p>
        </div>
      </div>
    </div>
  );
}
