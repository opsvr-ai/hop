"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Check, LogOut, Settings, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
  type: string;
  role: string;
}

export function Header() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceMenu, setSpaceMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [creating, setCreating] = useState(false);

  const currentSpaceId = (session as any)?.currentSpaceId;
  const currentSpace = spaces.find((s: Space) => s.id === currentSpaceId);
  const user = session?.user as any;

  useEffect(() => {
    if (!session) return;
    fetch("/api/hermes/spaces")
      .then((r) => r.json())
      .then((d) => setSpaces(d.spaces || []))
      .catch(() => {});
  }, [session]);

  async function switchSpace(spaceId: string) {
    await update({ currentSpaceId: spaceId });
    setSpaceMenu(false);
    router.refresh();
  }

  async function createSpace() {
    const name = prompt("空间名称:");
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/hermes/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpaces((prev) => [...prev, data]);
        await switchSpace(data.id);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleSignOut() {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b border-border/40 px-4 lg:h-14 bg-background/80 backdrop-blur-md shrink-0">
      {/* Space switcher */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setSpaceMenu(!spaceMenu)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span className="truncate max-w-[180px]">{currentSpace?.name || "选择空间"}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", spaceMenu && "rotate-180")} />
        </button>

        {spaceMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSpaceMenu(false)} />
            <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-xl z-20 py-1">
              {spaces.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => switchSpace(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  <span className="text-[0.6rem] text-muted-foreground uppercase">{s.role === "owner" ? "Owner" : s.role}</span>
                  {s.id === currentSpaceId && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
              <div className="border-t border-border/40 mt-1 pt-1">
                <button
                  type="button"
                  onClick={createSpace}
                  disabled={creating}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" /> 创建新空间
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserMenu(!userMenu)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground max-w-[120px] truncate">
            {user?.displayName || user?.username || "用户"}
          </span>
        </button>

        {userMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-xl z-20 py-1">
              <div className="px-3 py-2 border-b border-border/40">
                <p className="text-sm font-medium truncate">{user?.displayName || user?.username}</p>
                <p className="text-[0.65rem] text-muted-foreground truncate">{user?.email || ""}</p>
                {user?.isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[0.6rem] text-amber-600">
                    <Shield className="h-2.5 w-2.5" /> 管理员
                  </span>
                )}
              </div>
              {user?.isAdmin && (
                <button
                  type="button"
                  onClick={() => { setUserMenu(false); router.push("/admin/settings"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" /> 平台设置
                </button>
              )}
              <button
                type="button"
                onClick={() => { setUserMenu(false); handleSignOut(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-destructive"
              >
                <LogOut className="h-4 w-4" /> 退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
