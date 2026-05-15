"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  RefreshCw,
  Server,
  Users,
  Radio,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface HealthData {
  status: string;
  gateway_state: string;
  platforms: Record<string, { status: string; active_sessions?: number }>;
  active_agents: number;
  exit_reason: string | null;
  updated_at: string;
  pid: number;
}

interface CapabilitiesData {
  features: Record<string, boolean>;
  endpoints: Record<string, { method: string; path: string }>;
  auth: { type: string; required: boolean };
  runtime: { mode: string; tool_execution: string };
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "running" || status === "connected"
      ? "bg-emerald-500"
      : status === "disconnected"
        ? "bg-red-500"
        : "bg-amber-500";
  return (
    <span className={cn("inline-block h-2 w-2 rounded-full", color)}>
      <span className={cn("absolute inline-flex h-2 w-2 rounded-full opacity-75 animate-ping", color)} />
    </span>
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
  sub?: string;
  colorClass: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
        <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
        {sub && <div className="text-[0.7rem] text-muted-foreground/70">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [caps, setCaps] = useState<CapabilitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, cRes] = await Promise.all([
        fetch("/api/hermes/health/detailed"),
        fetch("/api/hermes/capabilities"),
      ]);
      if (!hRes.ok) throw new Error(`Health: ${hRes.status}`);
      if (!cRes.ok) throw new Error(`Capabilities: ${cRes.status}`);
      const [hData, cData] = await Promise.all([hRes.json(), cRes.json()]);
      setHealth(hData);
      setCaps(cData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">无法连接 Hermes 网关</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" /> 重试
          </button>
        </div>
      </div>
    );
  }

  const platformList = health?.platforms ? Object.entries(health.platforms) : [];
  const connectedCount = platformList.filter(
    ([, p]) => p.status === "connected" || p.status === "running",
  ).length;
  const features = caps?.features || {};
  const featureList = features
    ? Object.entries(features).filter(([, v]) => v === true)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">平台概览</h1>
            <p className="text-xs text-muted-foreground">Hermes Agent 运行状态</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> 刷新
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Server}
          label="网关状态"
          value={health?.gateway_state === "running" ? "运行中" : health?.gateway_state || "—"}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="活跃会话"
          value={`${health?.active_agents ?? 0} 个`}
          sub={`PID: ${health?.pid ?? "—"}`}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={Radio}
          label="平台连接"
          value={`${connectedCount}/${platformList.length}`}
          sub="已连接 / 总数"
          colorClass={
            connectedCount === platformList.length
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          }
        />
        <StatCard
          icon={Zap}
          label="API 能力"
          value={`${featureList.length} 项`}
          sub={caps?.runtime?.mode || "—"}
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      {/* Two-column detail area */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Platform status */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            平台连接状态
          </h2>
          <div className="space-y-2">
            {platformList.length === 0 ? (
              <p className="text-xs text-muted-foreground">无平台数据</p>
            ) : (
              platformList.slice(0, 12).map(([name, info]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm text-foreground/80 capitalize">{name.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-2">
                    {info.active_sessions != null && info.active_sessions > 0 && (
                      <span className="text-[0.65rem] text-muted-foreground">
                        {info.active_sessions} sessions
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[0.6rem]",
                        info.status === "connected" || info.status === "running"
                          ? "border-emerald-500/30 text-emerald-600"
                          : info.status === "disconnected"
                            ? "border-red-500/30 text-red-600"
                            : "border-amber-500/30 text-amber-600",
                      )}
                    >
                      <StatusDot status={info.status} />
                      <span className="ml-1.5">{info.status}</span>
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* API capabilities */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            API 能力
          </h2>
          <div className="space-y-1.5">
            {featureList.length === 0 ? (
              <p className="text-xs text-muted-foreground">无能力数据</p>
            ) : (
              featureList.map(([name]) => (
                <div
                  key={name}
                  className="flex items-center gap-2 py-1 px-2 rounded text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <code className="text-muted-foreground">{name}</code>
                </div>
              ))
            )}
          </div>
          {caps?.endpoints && (
            <div className="mt-4 pt-3 border-t border-border/40">
              <p className="text-[0.65rem] text-muted-foreground mb-2">
                {Object.keys(caps.endpoints).length} 个 API 端点
              </p>
              <div className="grid gap-1 grid-cols-2">
                {Object.entries(caps.endpoints)
                  .slice(0, 10)
                  .map(([name, info]) => (
                    <div key={name} className="text-[0.65rem] text-muted-foreground/60 flex items-center gap-1">
                      <Badge variant="outline" className="text-[0.55rem] px-1 py-0 h-4">
                        {info.method}
                      </Badge>
                      <code className="truncate">{info.path}</code>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth & Runtime info */}
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          运行时信息
        </h2>
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <span className="text-muted-foreground">运行模式:</span>{" "}
            <span className="font-medium">{caps?.runtime?.mode || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">工具执行:</span>{" "}
            <span className="font-medium">{caps?.runtime?.tool_execution || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">认证方式:</span>{" "}
            <span className="font-medium">{caps?.auth?.type || "—"}</span>
            {caps?.auth?.required && <Badge className="ml-1.5 text-[0.6rem]">需要密钥</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}
