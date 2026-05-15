"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bot,
  MessageSquare,
  Search,
  ShieldAlert,
  ClipboardCheck,
  Siren,
  Settings,
  Users,
  Key,
  Menu,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Brain,
  Wrench,
  Clock,
  Radio,
  BarChart3,
  Sparkles,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Cpu,
  Puzzle,
  ShieldCheck,
  Activity,
  History,
} from "lucide-react";
import { useState, useCallback } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SectionDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "ops",
    label: "运维中心",
    icon: ShieldAlert,
    items: [
      { href: "/ops/diagnosis", label: "故障定界", icon: Search },
      { href: "/ops/inspection", label: "日常巡检", icon: ClipboardCheck },
      { href: "/ops/emergency", label: "应急协同", icon: Siren },
    ],
  },
  {
    id: "ai",
    label: "AI 中心",
    icon: Sparkles,
    items: [
      { href: "/chat", label: "对话", icon: MessageSquare },
      { href: "/ai/memory", label: "记忆", icon: Brain },
      { href: "/ai/skills", label: "技能工具", icon: Wrench },
      { href: "/ai/jobs", label: "定时任务", icon: Clock },
      { href: "/ai/sessions", label: "会话历史", icon: History },
      { href: "/ai/analytics", label: "使用分析", icon: Activity },
    ],
  },
  {
    id: "admin",
    label: "控制中心",
    icon: Shield,
    items: [
      { href: "/dashboard", label: "平台概览", icon: LayoutDashboard },
      { href: "/admin/models", label: "模型管理", icon: Cpu },
      { href: "/admin/channels", label: "渠道管理", icon: Radio },
      { href: "/admin/plugins", label: "插件管理", icon: Puzzle },
      { href: "/admin/approvals", label: "审批队列", icon: ShieldCheck },
      { href: "/admin/users", label: "用户管理", icon: Users },
      { href: "/admin/settings", label: "系统配置", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const userInitials = session?.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "??";

  function isActive(href: string) {
    if (href === "/chat") return pathname === "/chat";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border px-3",
          collapsed ? "h-12 justify-center" : "h-14 gap-2",
        )}
      >
        {!collapsed && (
          <>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
              <Bot className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold tracking-tight">
                Hermes Ops
              </div>
            </div>
          </>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <Bot className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <PanelLeft className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* New conversation */}
      {!collapsed && (
        <div className="px-2 pt-3 pb-2">
          <Link
            href="/chat"
            className="flex items-center gap-2.5 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="truncate">新对话</span>
          </Link>
        </div>
      )}

      <ScrollArea className="flex-1">
        {/* Three center sections */}
        {!collapsed && (
          <div className="px-2 pb-2 space-y-1">
            {SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              const isCollapsed = collapsedSections.has(section.id);
              return (
                <div key={section.id}>
                  {/* Section header — clickable to collapse */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                  >
                    <SectionIcon className="h-3 w-3 shrink-0" />
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                  </button>

                  {/* Section items */}
                  {!isCollapsed && (
                    <nav className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto text-[0.6rem] px-1.5 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-primary">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center rounded-md transition-colors hover:bg-sidebar-accent",
                collapsed ? "justify-center px-2 py-1.5" : "gap-3 px-2 py-1.5",
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="text-[0.65rem] bg-sidebar-accent text-sidebar-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 truncate text-left">
                  <div className="text-xs font-medium truncate">
                    {session?.user?.name || "用户"}
                  </div>
                  <div className="text-[0.6rem] text-sidebar-foreground/50 truncate">
                    {session?.user?.email}
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>账户</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push("/settings/api-key")}
            >
              <Key className="mr-2 h-4 w-4" />
              API Key 设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:border-r lg:border-sidebar-border transition-all duration-300",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <div className="flex items-center gap-2 border-b px-3 py-2 lg:hidden bg-sidebar text-sidebar-foreground">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-sidebar border-sidebar-border"
          >
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link href="/chat" className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-sidebar-primary" />
          <span className="text-sm font-semibold">Hermes Ops</span>
        </Link>
      </div>
    </>
  );
}

export function Header() {
  const pathname = usePathname();

  // Build breadcrumb from the full section/item structure
  function getBreadcrumb(): string {
    if (pathname === "/chat") return "AI 中心 / 对话";
    if (pathname === "/dashboard") return "控制中心 / 平台概览";
    for (const section of SECTIONS) {
      for (const item of section.items) {
        if (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/chat") {
          return `${section.label} / ${item.label}`;
        }
      }
    }
    return "";
  }

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border/40 px-4 lg:h-14 bg-background/80 backdrop-blur-md">
      <span className="text-sm font-medium text-muted-foreground">
        {getBreadcrumb()}
      </span>
    </header>
  );
}
