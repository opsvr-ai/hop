"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Users, LinkIcon, Trash2, Shield, UserX, Crown, Copy, Check, Plus, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string; username: string; display_name: string; email: string;
  login_type: string; role: string; joined_at: number;
}

interface Invite {
  id: string; created_at: number; expires_at: number | null;
  max_uses: number | null; use_count: number;
}

interface SpaceData {
  id: string; name: string; description?: string; type: string;
  owner_id: string; member_role: string;
}

export default function SpaceSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [space, setSpace] = useState<SpaceData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");

  const user = session?.user as any;
  const myMembership = members.find((m) => m.id === user?.id);
  const canManage = myMembership?.role === "owner" || myMembership?.role === "admin";
  const isOwner = myMembership?.role === "owner";
  const isPersonal = space?.type === "personal";

  const fetchData = useCallback(async () => {
    try {
      const [spaceRes, membersRes, invitesRes] = await Promise.all([
        fetch(`/api/hermes/spaces/${id}`),
        fetch(`/api/hermes/spaces/${id}/members`),
        fetch(`/api/hermes/spaces/${id}/invites`),
      ]);
      if (!spaceRes.ok) throw new Error("空间不存在");
      const s = await spaceRes.json();
      setSpace(s);
      setName(s.name || "");
      setDesc(s.description || "");
      const m = await membersRes.json();
      setMembers(m.members || []);
      if (invitesRes.ok) {
        const inv = await invitesRes.json();
        setInvites(inv.invites || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSaveInfo() {
    setSaving(true);
    try {
      await fetch(`/api/hermes/spaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function updateMemberRole(targetId: string, role: string) {
    await fetch(`/api/hermes/spaces/${id}/members/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchData();
  }

  async function removeMember(targetId: string) {
    if (!confirm("确定移除此成员？")) return;
    await fetch(`/api/hermes/spaces/${id}/members/${targetId}`, { method: "DELETE" });
    fetchData();
  }

  async function createInvite() {
    await fetch(`/api/hermes/spaces/${id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_uses: 0, expires_in_hours: 0 }),
    });
    fetchData();
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm("确定撤销此邀请？")) return;
    await fetch(`/api/hermes/spaces/${id}/invites/${inviteId}`, { method: "DELETE" });
    fetchData();
  }

  async function copyInviteUrl(inviteId: string) {
    const url = `${window.location.origin}/join/${inviteId}`;
    await navigator.clipboard.writeText(url);
    setCopied(inviteId);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleDeleteSpace() {
    if (!confirm("确定删除此空间？所有成员和邀请将一并删除，此操作不可撤销。")) return;
    await fetch(`/api/hermes/spaces/${id}`, { method: "DELETE" });
    router.push("/chat");
  }

  function timeAgo(ts: number): string {
    const diff = (Date.now() / 1000) - ts;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push("/chat")}><ArrowLeft className="mr-2 h-4 w-4" /> 返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/chat")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{space?.name}</h1>
          <p className="text-xs text-muted-foreground">空间设置 · {isPersonal ? "个人空间" : "项目空间"}</p>
        </div>
      </div>

      {/* Basic info */}
      {canManage && !isPersonal && (
        <section className="glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" />基本信息</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">空间名称</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">描述</label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="text-sm" placeholder="可选" />
            </div>
          </div>
          <Button size="sm" onClick={handleSaveInfo} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} 保存
          </Button>
        </section>
      )}

      {/* Members */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />成员 ({members.length})</h2>
        <div className="space-y-1">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <span className="text-sm font-medium">{m.display_name || m.username}</span>
                <span className="text-xs text-muted-foreground ml-2">{m.email || ""}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.role === "owner" ? (
                  <Badge variant="outline" className="text-[0.6rem]"><Crown className="h-2.5 w-2.5 mr-0.5" />Owner</Badge>
                ) : m.role === "admin" ? (
                  <Badge variant="secondary" className="text-[0.6rem]">Admin</Badge>
                ) : (
                  <span className="text-[0.65rem] text-muted-foreground">Member</span>
                )}
                {canManage && m.role !== "owner" && (
                  <div className="flex gap-1">
                    {m.role === "member" ? (
                      <button onClick={() => updateMemberRole(m.id, "admin")} className="text-[0.6rem] text-muted-foreground hover:text-primary px-1" title="提升为管理员">↑ Admin</button>
                    ) : (
                      <button onClick={() => updateMemberRole(m.id, "member")} className="text-[0.6rem] text-muted-foreground hover:text-primary px-1" title="降级为成员">↓ Member</button>
                    )}
                    <button onClick={() => removeMember(m.id)} className="text-[0.6rem] text-red-500 hover:text-red-600 px-1" title="移除"><UserX className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invites */}
      {!isPersonal && canManage && (
        <section className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4 text-muted-foreground" />邀请链接 ({invites.length})</h2>
            <Button size="sm" variant="outline" onClick={createInvite}><Plus className="h-3.5 w-3.5 mr-1" /> 新建</Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">暂无邀请链接，点击"新建"创建一个</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div>
                    <code className="text-xs font-mono">{inv.id.slice(0, 24)}...</code>
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5">
                      {inv.max_uses ? `已用 ${inv.use_count}/${inv.max_uses}` : `已用 ${inv.use_count} 次`}
                      {inv.expires_at ? ` · ${new Date(inv.expires_at * 1000).toLocaleDateString("zh-CN")} 到期` : " · 永不过期"}
                      <span className="ml-2">{timeAgo(inv.created_at)}创建</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyInviteUrl(inv.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="复制链接">
                      {copied === inv.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => revokeInvite(inv.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors" title="撤销">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Danger zone */}
      {isOwner && !isPersonal && (
        <section className="glass-panel rounded-xl p-5 space-y-3 border border-red-500/20">
          <h2 className="text-sm font-semibold text-red-600 flex items-center gap-2"><Trash2 className="h-4 w-4" />危险操作</h2>
          <p className="text-xs text-muted-foreground">删除空间将移除所有成员、邀请和关联数据，此操作不可撤销。</p>
          <Button variant="destructive" size="sm" onClick={handleDeleteSpace}>删除此空间</Button>
        </section>
      )}
    </div>
  );
}
