"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, User, History, RefreshCw, Database, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MemoryData {
  memory: {
    entries: string[];
    usage: string;
    entry_count: number;
    char_limit: number;
  };
  user: {
    entries: string[];
    usage: string;
    entry_count: number;
    char_limit: number;
  };
  sessions: Array<{
    id: string;
    source: string;
    model: string;
    title: string;
    started_at: number;
    message_count: number;
    preview: string;
  }>;
  providers?: Array<{
    name: string;
    type: string;
  }>;
}

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function MemoryEntryCard({ content, index }: { content: string; index: number }) {
  return (
    <div className="glass-panel-subtle rounded-xl p-4 transition-all hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center h-5 w-5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5 text-[0.6rem] font-bold font-mono">
          {index + 1}
        </span>
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words flex-1">
          {content}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  colorClass: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          colorClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </div>
        <div className="text-lg font-semibold text-foreground mt-0.5">
          {value}
        </div>
        <div className="text-[0.7rem] text-muted-foreground/70">{sub}</div>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const [data, setData] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("memory");

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hermes/memory");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memory data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">加载失败</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={fetchMemory}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  const totalEntries =
    (data?.memory.entry_count ?? 0) + (data?.user.entry_count ?? 0);
  const hasSessions = (data?.sessions.length ?? 0) > 0;

  if (!data || (totalEntries === 0 && !hasSessions)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <Database className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">暂无记忆数据</h2>
            <p className="text-sm text-muted-foreground mt-1">
              在与 Hermes Agent 对话时，AI 会自动保存有价值的记忆信息
            </p>
          </div>
          <button
            onClick={fetchMemory}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">记忆</h1>
            <p className="text-xs text-muted-foreground">
              Hermes Agent 持久化记忆与用户档案
            </p>
          </div>
        </div>
        <button
          onClick={fetchMemory}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          刷新
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Brain}
          label="MEMORY.md"
          value={`${data.memory.entry_count} 条`}
          sub={data.memory.usage}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={User}
          label="USER.md"
          value={`${data.user.entry_count} 条`}
          sub={data.user.usage}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={History}
          label="会话历史"
          value={`${data.sessions.length} 个`}
          sub={data.providers && data.providers.length > 0 ? `${data.providers.length} providers` : "本地存储"}
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      {/* Providers (if any) */}
      {data.providers && data.providers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[0.65rem] text-muted-foreground mr-1">
            外部 Providers:
          </span>
          {data.providers.map((p) => (
            <Badge key={p.name} variant="outline" className="text-[0.65rem]">
              {p.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="memory">
            <Brain className="h-3.5 w-3.5" />
            MEMORY.md
            <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0 h-4">
              {data.memory.entry_count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="user">
            <User className="h-3.5 w-3.5" />
            USER.md
            <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0 h-4">
              {data.user.entry_count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <History className="h-3.5 w-3.5" />
            会话历史
            <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0 h-4">
              {data.sessions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* MEMORY.md tab */}
        <TabsContent value="memory">
          {data.memory.entries.length === 0 ? (
            <EmptyTab
              icon={Brain}
              title="暂无 MEMORY 条目"
              desc="AI 会在对话中自动记录有价值的项目信息、环境事实和经验教训"
            />
          ) : (
            <div className="space-y-2.5">
              {data.memory.entries.map((entry, i) => (
                <MemoryEntryCard key={i} content={entry} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* USER.md tab */}
        <TabsContent value="user">
          {data.user.entries.length === 0 ? (
            <EmptyTab
              icon={User}
              title="暂无 USER 条目"
              desc="AI 会记录你的偏好、角色和沟通风格等信息"
            />
          ) : (
            <div className="space-y-2.5">
              {data.user.entries.map((entry, i) => (
                <MemoryEntryCard key={i} content={entry} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions tab */}
        <TabsContent value="sessions">
          {data.sessions.length === 0 ? (
            <EmptyTab
              icon={History}
              title="暂无会话历史"
              desc="完成对话后，会话摘要会出现在这里"
            />
          ) : (
            <div className="space-y-2.5">
              {data.sessions.map((session) => (
                <div
                  key={session.id}
                  className="glass-panel-subtle rounded-xl p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {session.title || "未命名会话"}
                        </h3>
                        {session.source && (
                          <Badge variant="outline" className="text-[0.6rem] shrink-0">
                            {session.source}
                          </Badge>
                        )}
                      </div>
                      {session.preview && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {session.preview}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground/60">
                        <span>{formatTimestamp(session.started_at)}</span>
                        {session.message_count > 0 && (
                          <span>{session.message_count} 条消息</span>
                        )}
                        {session.model && <span>{session.model}</span>}
                      </div>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
      <Icon className="h-8 w-8 text-muted-foreground/50 mx-auto" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{desc}</p>
      </div>
    </div>
  );
}
