"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, User, Lock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

type Phase = "checking" | "setup" | "done";

export default function SetupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hermes/auth/has-admin")
      .then((r) => r.json())
      .then((d) => setPhase(d.has_admin ? "done" : "setup"))
      .catch(() => setPhase("setup"));
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/hermes/auth/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }
      setPhase("done");
    } catch {
      setError("网络错误，请确认 Hermes 后端已启动");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center dot-grid-surface">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center dot-grid-surface">
        <Card className="glass-panel-strong shadow-lg border-border/40 w-full max-w-md text-center">
          <CardHeader className="space-y-1">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <CardTitle>平台已初始化</CardTitle>
            <CardDescription>管理员账号已创建，请前往登录</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/login")}>
              前往登录 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center dot-grid-surface">
      <Card className="glass-panel-strong shadow-lg border-border/40 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">平台初始化</CardTitle>
          <CardDescription>创建首位管理员账号以开始使用</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">管理员用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username" type="text" placeholder="admin"
                  className="pl-9" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码 (至少 8 位)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password" type="password" placeholder="••••••••"
                  className="pl-9" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm" type="password" placeholder="再次输入密码"
                  className="pl-9" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required minLength={8}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !username || !password || !confirm}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              创建管理员
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            首次运行 Hermes Ops · 此步骤仅需执行一次
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
