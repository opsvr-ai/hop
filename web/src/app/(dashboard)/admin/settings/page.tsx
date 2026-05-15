"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Settings, Shield, Globe, Loader2, AlertCircle, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserItem {
  id: string; login_type: string; username: string; display_name: string;
  email: string; department?: string; is_admin: number;
  created_at: number; last_login_at: number | null;
}

interface LdapConfig {
  url: string; baseDN: string; bindDN: string; userFilter: string;
  displayNameAttr: string; emailAttr: string; deptAttr: string; adminGroup: string;
}

type Tab = "users" | "branding" | "ldap";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [brandingName, setBrandingName] = useState("");
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState("");

  const [ldap, setLdap] = useState<LdapConfig>({
    url: "", baseDN: "", bindDN: "", userFilter: "",
    displayNameAttr: "displayName", emailAttr: "mail",
    deptAttr: "department", adminGroup: "",
  });
  const [ldapPassword, setLdapPassword] = useState("");
  const [ldapSaving, setLdapSaving] = useState(false);
  const [ldapTestResult, setLdapTestResult] = useState<string | null>(null);
  const [ldapTestError, setLdapTestError] = useState<string | null>(null);
  const [ldapTesting, setLdapTesting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/hermes/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/hermes/config/branding");
      const data = await res.json();
      setBrandingName(data.name || "");
      if (data.ldap) setLdap(data.ldap);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsers(); fetchConfig(); }, [fetchUsers, fetchConfig]);

  async function toggleAdmin(userId: string) {
    await fetch(`/api/hermes/users/${userId}/admin`, { method: "PATCH" });
    fetchUsers();
  }

  async function saveBranding() {
    setBrandingSaving(true);
    setBrandingError("");
    try {
      const res = await fetch("/api/hermes/config/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: brandingName }),
      });
      if (!res.ok) {
        const d = await res.json();
        setBrandingError(d.error || "保存失败");
      }
    } catch {
      setBrandingError("网络错误");
    } finally { setBrandingSaving(false); }
  }

  async function saveLdap() {
    setLdapSaving(true);
    setLdapTestResult(null);
    setLdapTestError(null);
    try {
      const body: Record<string, unknown> = { ldap: { ...ldap } };
      if (ldapPassword) (body.ldap as Record<string, unknown>).bindPassword = ldapPassword;
      const res = await fetch("/api/hermes/config/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setLdapTestError(d.error || "保存失败");
      } else {
        setLdapTestResult("配置已保存");
      }
    } catch {
      setLdapTestError("网络错误");
    } finally { setLdapSaving(false); }
  }

  async function testLdap() {
    setLdapTesting(true);
    setLdapTestResult(null);
    setLdapTestError(null);
    try {
      const res = await fetch("/api/hermes/config/ldap/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ldap.url,
          bindDN: ldap.bindDN,
          bindPassword: ldapPassword,
          adminGroup: ldap.adminGroup || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setLdapTestResult(data.message || "连接成功");
      } else {
        setLdapTestError(data.error || "连接失败");
      }
    } catch {
      setLdapTestError("网络错误");
    } finally { setLdapTesting(false); }
  }

  function timeAgo(ts: number): string {
    if (!ts) return "从未";
    const diff = (Date.now() / 1000) - ts;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
  }

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "users", icon: <Users className="h-3.5 w-3.5" />, label: "用户管理" },
    { key: "branding", icon: <Globe className="h-3.5 w-3.5" />, label: "平台品牌" },
    { key: "ldap", icon: <Shield className="h-3.5 w-3.5" />, label: "LDAP 配置" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/chat")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">平台设置</h1>
          <p className="text-xs text-muted-foreground">管理员配置</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <section className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />用户 ({users.length})
            </h2>
            <button onClick={fetchUsers} className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors" title="刷新">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-1">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{u.display_name || u.username}</span>
                      {u.is_admin ? <Badge variant="outline" className="text-[0.6rem] text-amber-600"><Shield className="h-2.5 w-2.5 mr-0.5" />Admin</Badge> : null}
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground mt-0.5">
                      {u.username && <span>{u.username}</span>}
                      {u.email && <span className="ml-2">{u.email}</span>}
                      <Badge variant="secondary" className="ml-2 text-[0.55rem] px-1 py-0">{u.login_type}</Badge>
                      <span className="ml-2">最近登录: {u.last_login_at ? timeAgo(u.last_login_at) : "从未"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdmin(u.id)}
                    className={cn(
                      "text-[0.65rem] px-2 py-1 rounded-md transition-colors shrink-0",
                      u.is_admin ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                    )}
                  >
                    {u.is_admin ? "移除管理员" : "设为管理员"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Branding tab */}
      {tab === "branding" && (
        <section className="glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />平台品牌</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">平台名称</label>
            <Input
              value={brandingName}
              onChange={(e) => setBrandingName(e.target.value)}
              className="text-sm max-w-sm"
              placeholder="Hermes Ops"
            />
          </div>
          {brandingError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {brandingError}
            </div>
          )}
          <Button size="sm" onClick={saveBranding} disabled={brandingSaving || !brandingName.trim()}>
            {brandingSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} 保存
          </Button>
        </section>
      )}

      {/* LDAP tab */}
      {tab === "ldap" && (
        <section className="glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />LDAP 配置</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">LDAP URL</label>
              <Input value={ldap.url} onChange={(e) => setLdap({ ...ldap, url: e.target.value })} className="text-sm" placeholder="ldap://ldap.example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Base DN</label>
              <Input value={ldap.baseDN} onChange={(e) => setLdap({ ...ldap, baseDN: e.target.value })} className="text-sm" placeholder="dc=example,dc=com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bind DN</label>
              <Input value={ldap.bindDN} onChange={(e) => setLdap({ ...ldap, bindDN: e.target.value })} className="text-sm" placeholder="cn=admin,dc=example,dc=com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bind 密码</label>
              <Input type="password" value={ldapPassword} onChange={(e) => setLdapPassword(e.target.value)} className="text-sm" placeholder="输入以更新" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">用户过滤器</label>
              <Input value={ldap.userFilter} onChange={(e) => setLdap({ ...ldap, userFilter: e.target.value })} className="text-sm" placeholder="(objectClass=person)" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">管理员组 DN</label>
              <Input value={ldap.adminGroup} onChange={(e) => setLdap({ ...ldap, adminGroup: e.target.value })} className="text-sm" placeholder="cn=admins,ou=groups,..." />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">显示名属性</label>
              <Input value={ldap.displayNameAttr} onChange={(e) => setLdap({ ...ldap, displayNameAttr: e.target.value })} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">邮箱属性</label>
              <Input value={ldap.emailAttr} onChange={(e) => setLdap({ ...ldap, emailAttr: e.target.value })} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">部门属性</label>
              <Input value={ldap.deptAttr} onChange={(e) => setLdap({ ...ldap, deptAttr: e.target.value })} className="text-sm" />
            </div>
          </div>

          {ldapTestResult && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              <Check className="h-4 w-4 shrink-0" /> {ldapTestResult}
            </div>
          )}
          {ldapTestError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {ldapTestError}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={testLdap} disabled={ldapTesting || !ldap.url}>
              {ldapTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} 测试连接
            </Button>
            <Button size="sm" onClick={saveLdap} disabled={ldapSaving}>
              {ldapSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} 保存配置
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
