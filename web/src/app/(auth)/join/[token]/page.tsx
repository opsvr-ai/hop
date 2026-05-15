"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, LogIn, AlertCircle, CheckCircle, Users } from "lucide-react";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [spaceName, setSpaceName] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/hermes/invites/${token}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (ok) {
          setSpaceName(data.space_name || "");
        } else {
          setPreviewError(data.error || "邀请链接无效或已过期");
        }
      })
      .catch(() => setPreviewError("无法连接到服务器"))
      .finally(() => setPreviewLoading(false));
  }, [token]);

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch(`/api/hermes/invites/${token}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "加入失败");
        return;
      }
      setJoined(true);
      setTimeout(() => router.push("/chat"), 1500);
    } catch {
      setJoinError("网络错误");
    } finally {
      setJoining(false);
    }
  }

  if (previewLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (previewError) {
    return (
      <Card className="glass-panel-strong shadow-lg border-border/40 text-center">
        <CardHeader className="space-y-1">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <CardTitle>邀请无效</CardTitle>
          <CardDescription>{previewError}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => router.push("/login")}>
            前往登录
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (joined) {
    return (
      <Card className="glass-panel-strong shadow-lg border-border/40 text-center">
        <CardHeader className="space-y-1">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <CardTitle>加入成功</CardTitle>
          <CardDescription>你已加入 {spaceName}，即将跳转...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status !== "authenticated") {
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/join/${token}`)}`;
    return (
      <Card className="glass-panel-strong shadow-lg border-border/40 text-center">
        <CardHeader className="space-y-1">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <CardTitle>加入 {spaceName}</CardTitle>
          <CardDescription>你被邀请加入此空间，请先登录以接受邀请</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push(loginUrl)}>
            <LogIn className="mr-2 h-4 w-4" /> 登录并加入
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="glass-panel-strong shadow-lg border-border/40 text-center">
      <CardHeader className="space-y-1">
        <Users className="h-10 w-10 text-primary mx-auto" />
        <CardTitle>加入 {spaceName}</CardTitle>
        <CardDescription>
          以 <strong>{session.user?.name || session.user?.email}</strong> 的身份加入此空间
        </CardDescription>
      </CardHeader>

      {joinError && (
        <CardContent className="pb-0">
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {joinError}
          </div>
        </CardContent>
      )}

      <CardFooter className="justify-center pt-4">
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          接受邀请 <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
