"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Plus,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Edit3,
  AlertCircle,
  XCircle,
  Loader2,
  X,
  Hash,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CronJob {
  id: string;
  name: string;
  prompt: string;
  schedule: { kind: string; display?: string; expr?: string; minutes?: number };
  state: string;
  enabled: boolean;
  model?: string;
  deliver?: string;
  skills?: string[];
  total_runs?: number;
  last_completed?: string;
  next_run?: string;
  created_at?: string;
}

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { label: "已调度", color: "text-blue-600", bg: "bg-blue-500/8", icon: Clock },
  running: { label: "运行中", color: "text-emerald-600", bg: "bg-emerald-500/8", icon: Loader2 },
  paused: { label: "已暂停", color: "text-amber-600", bg: "bg-amber-500/8", icon: Pause },
  error: { label: "错误", color: "text-red-600", bg: "bg-red-500/8", icon: XCircle },
};

function formatTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("zh-CN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ts; }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [drawer, setDrawer] = useState<{ open: boolean; job: CronJob | null }>({ open: false, job: null });
  const [saving, setSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hermes/jobs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleAction = useCallback(async (jobId: string, action: string) => {
    try {
      const res = await fetch(`/api/hermes/jobs/${jobId}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }, [fetchJobs]);

  const handleDelete = useCallback(async (jobId: string) => {
    if (!confirm("确定删除此任务？")) return;
    try {
      await fetch(`/api/hermes/jobs/${jobId}`, { method: "DELETE" });
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }, [fetchJobs]);

  const handleSave = useCallback(async () => {
    const job = drawer.job;
    if (!job) return;
    setSaving(true);
    try {
      if (job.id) {
        await fetch(`/api/hermes/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: job.name, prompt: job.prompt, state: job.state }),
        });
      } else {
        await fetch("/api/hermes/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: job.name, prompt: job.prompt }),
        });
      }
      setDrawer({ open: false, job: null });
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [drawer.job, fetchJobs]);

  const filteredJobs = filter === "all" ? jobs : jobs.filter((j) => j.state === filter);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">加载失败</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchJobs} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">定时任务</h1>
            <p className="text-xs text-muted-foreground">{jobs.length} 个任务</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchJobs} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> 刷新
          </button>
          <button
            onClick={() => setDrawer({ open: true, job: { id: "", name: "", prompt: "", schedule: { kind: "interval", minutes: 30 }, state: "scheduled", enabled: true } as CronJob })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> 新建
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: "all", label: "全部" },
          { key: "scheduled", label: "已调度" },
          { key: "running", label: "运行中" },
          { key: "paused", label: "已暂停" },
          { key: "error", label: "错误" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredJobs.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">暂无定时任务</p>
          <p className="text-xs text-muted-foreground/60">创建定时任务以自动化重复性工作</p>
          <button
            onClick={() => setDrawer({ open: true, job: { id: "", name: "", prompt: "", schedule: { kind: "interval", minutes: 30 }, state: "scheduled", enabled: true } as CronJob })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 mt-2"
          >
            <Plus className="h-4 w-4" /> 创建第一个任务
          </button>
        </div>
      )}

      {/* Job card grid */}
      {!loading && filteredJobs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => {
            const stateCfg = STATE_CONFIG[job.state] || STATE_CONFIG.scheduled;
            const StateIcon = stateCfg.icon;
            return (
              <div
                key={job.id}
                className="glass-panel rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer group flex flex-col"
                onClick={() => setDrawer({ open: true, job })}
              >
                {/* Top row: status + quick actions */}
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className={cn("text-[0.6rem] px-1.5 py-0 h-5", stateCfg.color, stateCfg.bg)}>
                    <StateIcon className={cn("h-2.5 w-2.5", job.state === "running" && "animate-spin")} />
                    <span className="ml-1">{stateCfg.label}</span>
                  </Badge>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {job.state !== "running" && (
                      <button onClick={() => handleAction(job.id, "run")} className="p-1 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors" title="立即执行">
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                    {job.state === "running" ? (
                      <button onClick={() => handleAction(job.id, "pause")} className="p-1 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors" title="暂停">
                        <Pause className="h-3 w-3" />
                      </button>
                    ) : job.state === "paused" ? (
                      <button onClick={() => handleAction(job.id, "resume")} className="p-1 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors" title="恢复">
                        <Play className="h-3 w-3" />
                      </button>
                    ) : null}
                    <button onClick={() => { setDrawer({ open: true, job }); }} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="编辑">
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="删除">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Job name */}
                <h3 className="text-sm font-medium text-foreground truncate mb-1.5 group-hover:text-primary transition-colors">
                  {job.name || "未命名任务"}
                </h3>

                {/* Prompt preview */}
                <p className="text-[0.65rem] text-muted-foreground line-clamp-2 leading-relaxed mb-3 flex-1">
                  {job.prompt || "无描述"}
                </p>

                {/* Schedule info */}
                <div className="flex items-center gap-1.5 mb-2 text-[0.6rem] text-muted-foreground/60">
                  <CalendarClock className="h-3 w-3" />
                  <span>{job.schedule?.display || "—"}</span>
                </div>

                {/* Bottom row: metadata */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border/30">
                  <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground/50">
                    {job.total_runs != null && job.total_runs > 0 && (
                      <span className="flex items-center gap-1">
                        <Hash className="h-2.5 w-2.5" />
                        {job.total_runs} 次
                      </span>
                    )}
                    {job.last_completed && (
                      <span>上次 {formatTime(job.last_completed)}</span>
                    )}
                  </div>
                  {job.model && (
                    <Badge variant="secondary" className="text-[0.55rem] px-1 py-0 h-4">{job.model}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer — create / edit */}
      {drawer.open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDrawer({ open: false, job: null })} />
          <div className="relative w-full max-w-lg h-full animate-[tool-drawer-in_0.25s_ease-out] bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="text-sm font-semibold text-foreground">
                {drawer.job?.id ? "编辑任务" : "创建任务"}
              </h2>
              <button
                onClick={() => setDrawer({ open: false, job: null })}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">任务名称</label>
                <input
                  type="text"
                  value={drawer.job?.name || ""}
                  onChange={(e) => setDrawer((d) => d.job ? { ...d, job: { ...d.job, name: e.target.value } } : d)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="例如：每日巡检"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">提示词</label>
                <textarea
                  value={drawer.job?.prompt || ""}
                  onChange={(e) => setDrawer((d) => d.job ? { ...d, job: { ...d.job, prompt: e.target.value } } : d)}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                  placeholder="输入要执行的提示词…"
                />
              </div>

              {drawer.job?.id && (
                <div className="grid gap-3 grid-cols-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">执行次数:</span>{" "}
                    <span className="font-medium">{drawer.job.total_runs ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">上次完成:</span>{" "}
                    <span className="font-medium">{formatTime(drawer.job.last_completed)}</span>
                  </div>
                  {drawer.job.deliver && (
                    <div>
                      <span className="text-muted-foreground">投递:</span>{" "}
                      <span className="font-medium">{drawer.job.deliver}</span>
                    </div>
                  )}
                  {drawer.job.skills && drawer.job.skills.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">技能:</span>{" "}
                      {drawer.job.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="ml-1 text-[0.6rem]">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between">
              <div>
                {drawer.job?.id && (
                  <button
                    onClick={() => handleDelete(drawer.job!.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> 删除
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawer({ open: false, job: null })}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !drawer.job?.name.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
