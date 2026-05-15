"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  RefreshCw,
  Search,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SessionItem {
  id: string;
  source: string;
  model: string;
  title: string;
  started_at: number;
  ended_at: number | null;
  message_count: number;
  tool_call_count: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number | null;
}

interface SessionDetail {
  session: SessionItem & { system_prompt: string };
  messages: Array<{
    id: string;
    role: string;
    content: string;
    tool_name: string | null;
    timestamp: number;
  }>;
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString("zh-CN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(ts); }
}

function formatCost(cost: number | null | undefined): string {
  if (cost == null) return "—";
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (source) params.set("source", source);
      const res = await fetch(`/api/hermes/sessions?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openDetail = useCallback(async (sessionId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/hermes/sessions/${sessionId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDetail(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">加载失败</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchSessions} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <RefreshCw className="h-4 w-4" /> 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">会话历史</h1>
            <p className="text-xs text-muted-foreground">{total} 个会话</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">全部来源</option>
            <option value="api_server">API</option>
            <option value="cli">CLI</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="slack">Slack</option>
          </select>
          <button onClick={fetchSessions} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> 刷新
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && sessions.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <History className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">暂无会话记录</p>
          <p className="text-xs text-muted-foreground/60">开始对话后，会话历史会出现在这里</p>
        </div>
      )}

      {/* Session list */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => openDetail(s.id)}
              className="glass-panel rounded-xl p-4 transition-all hover:shadow-sm cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {s.title || "未命名会话"}
                    </h3>
                    {s.source && (
                      <Badge variant="outline" className="text-[0.6rem] shrink-0">
                        {s.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[0.7rem] text-muted-foreground">
                    <span>{formatTime(s.started_at)}</span>
                    <span>{s.message_count} 条消息</span>
                    {s.tool_call_count > 0 && <span>{s.tool_call_count} 次工具调用</span>}
                    {s.model && <Badge variant="secondary" className="text-[0.6rem]">{s.model}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-[0.7rem] text-muted-foreground">
                      {(s.input_tokens + s.output_tokens).toLocaleString()} tokens
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground/50">
                      {formatCost(s.estimated_cost_usd)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-xl h-full animate-[tool-drawer-in_0.25s_ease-out] bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {detail.session.title || "会话详情"}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[0.6rem]">{detail.session.source}</Badge>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {detail.session.message_count} 消息 · {(detail.session.input_tokens + detail.session.output_tokens).toLocaleString()} tokens
                  </span>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {detailLoading && <Skeleton className="h-96 rounded-xl" />}
              {!detailLoading && detail.messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-12">无消息记录</p>
              )}
              {!detailLoading &&
                detail.messages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-xs",
                      msg.role === "user"
                        ? "bg-primary/6 ml-6"
                        : msg.role === "tool"
                          ? "bg-amber-50 dark:bg-amber-900/10 mx-2 border border-amber-200/50 dark:border-amber-700/30"
                          : "bg-muted/40 mr-6",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[0.55rem]",
                          msg.role === "user" && "border-blue-300 text-blue-600",
                          msg.role === "assistant" && "border-emerald-300 text-emerald-600",
                          msg.role === "tool" && "border-amber-300 text-amber-600",
                        )}
                      >
                        {msg.role}
                      </Badge>
                      {msg.tool_name && (
                        <span className="text-[0.6rem] text-muted-foreground font-mono">{msg.tool_name}</span>
                      )}
                      <span className="text-[0.6rem] text-muted-foreground/50 ml-auto">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap break-words line-clamp-6">
                      {msg.content || "(empty)"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
