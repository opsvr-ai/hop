"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, LogIn, User, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dot-grid-surface">
        <Card className="glass-panel-strong shadow-lg border-border/40 w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Hermes Ops</CardTitle>
            <CardDescription>加载中...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

type TabKey = "ldap" | "local";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";
  const errorParam = searchParams.get("error");

  const [tab, setTab] = useState<TabKey>("ldap");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? "登录失败，请检查凭据" : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(tab, {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(tab === "ldap" ? "LDAP 认证失败，请检查用户名或密码" : "用户名或密码错误");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("登录服务异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center dot-grid-surface">
      <Card className="glass-panel-strong shadow-lg border-border/40 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Hermes Ops</CardTitle>
          <CardDescription>智能运维平台 · 请登录以继续</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-muted/60 p-1">
            {([
              { key: "ldap", label: "LDAP 登录" },
              { key: "local", label: "本地登录" },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setError(null); }}
                className={cn(
                  "flex-1 py-2 text-xs font-medium rounded-md transition-colors",
                  tab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                {tab === "ldap" ? "域账号" : "用户名"}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder={tab === "ldap" ? "sAMAccountName" : "admin"}
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !username || !password}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              登录
            </Button>
          </form>

          {tab === "local" && (
            <p className="text-center text-xs text-muted-foreground">
              本地登录仅用于管理员紧急访问。普通用户请使用 LDAP 登录。
            </p>
          )}
          {tab === "ldap" && (
            <p className="text-center text-xs text-muted-foreground">
              LDAP 登录需先在控制中心配置域服务器信息
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Hermes Ops v0.1.0 · Powered by Hermes Agent
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
