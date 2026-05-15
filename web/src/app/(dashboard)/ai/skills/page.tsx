"use client";

import { Wrench, Package, Download, Star, Shield, AlertCircle, Box, Cpu, Globe, FileText, Terminal, Code2, Brain, Eye, Image, Volume2, Mic, Users, Kanban, Clock, MessageCircle, Home, FileType, Bot } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SKILL_CATEGORIES = [
  { name: "software-development", label: "软件开发", count: 45, icon: "💻", desc: "编码、调试、架构设计等开发相关技能" },
  { name: "devops", label: "DevOps", count: 32, icon: "🚀", desc: "CI/CD、容器化、监控运维等基础设施技能" },
  { name: "data-science", label: "数据科学", count: 28, icon: "📊", desc: "数据分析、机器学习、可视化等数据技能" },
  { name: "productivity", label: "生产力", count: 24, icon: "⚡", desc: "自动化、工作流优化、效率工具等" },
  { name: "github", label: "GitHub", count: 18, icon: "🐙", desc: "PR 管理、Issue 追踪、代码审查等" },
  { name: "research", label: "研究", count: 15, icon: "🔬", desc: "文献搜索、知识整合、深度分析等" },
  { name: "autonomous-ai-agents", label: "AI Agent", count: 14, icon: "🤖", desc: "多代理协作、自主任务执行等" },
  { name: "creative", label: "创意", count: 12, icon: "🎨", desc: "设计、写作、创意生成等" },
  { name: "media", label: "媒体", count: 10, icon: "🎬", desc: "视频处理、音频编辑、图像处理等" },
  { name: "note-taking", label: "笔记", count: 8, icon: "📝", desc: "知识管理、笔记整理、信息归档等" },
  { name: "social-media", label: "社交媒体", count: 7, icon: "📱", desc: "内容发布、互动管理、数据分析等" },
  { name: "email", label: "邮件", count: 6, icon: "✉️", desc: "邮件撰写、批量发送、自动回复等" },
];

const TOOLSETS = [
  { name: "hermes-cli", description: "核心 CLI 工具集，提供命令行交互、配置管理、会话控制等基础能力", count: 12, bundled: true },
  { name: "browser", description: "浏览器自动化操作，支持页面导航、元素交互、截图等功能", count: 4, bundled: true },
  { name: "web", description: "Web 内容搜索与信息提取，支持多搜索引擎和网页抓取", count: 2, bundled: true },
  { name: "file", description: "文件系统读写操作，支持文本、二进制等多种格式", count: 3, bundled: true },
  { name: "terminal", description: "终端命令执行，支持 Shell 脚本和命令管道", count: 1, bundled: true },
  { name: "code_exec", description: "代码执行沙箱环境，支持 Python/JS 等语言的安全运行", count: 1, bundled: true },
  { name: "memory", description: "持久化记忆存储，支持会话上下文和长期知识保留", count: 1, bundled: true },
  { name: "vision", description: "图像识别与分析，支持 OCR、物体检测等视觉能力", count: 2, bundled: true },
  { name: "image_gen", description: "AI 图像生成，支持文生图、图生图等多种模式", count: 1, bundled: false },
  { name: "tts", description: "文字转语音合成，支持多语言和多种音色", count: 1, bundled: false },
  { name: "transcription", description: "语音转文字识别，支持多语种音频转录", count: 1, bundled: false },
  { name: "delegate", description: "子代理委派，将复杂任务拆解并分配给专业子代理", count: 1, bundled: true },
  { name: "kanban", description: "多代理看板协作，可视化管理和追踪多代理任务", count: 1, bundled: false },
  { name: "skills", description: "技能注册与管理，支持动态加载和热更新技能模块", count: 4, bundled: true },
  { name: "cron", description: "定时任务调度，支持 Cron 表达式和间隔执行模式", count: 1, bundled: true },
  { name: "discord", description: "Discord 平台集成，支持消息发送和频道管理", count: 1, bundled: false },
  { name: "homeassistant", description: "HomeAssistant 智能家居平台集成", count: 1, bundled: false },
  { name: "feishu", description: "飞书文档读写操作，支持多维表格和云文档", count: 2, bundled: false },
  { name: "yuanbao", description: "腾讯元宝 AI 平台集成，支持模型调用和能力扩展", count: 1, bundled: false },
];

function ToolsetIcon({ name }: { name: string }) {
  const cls = "h-5 w-5 text-primary/70";
  const icons: Record<string, React.ReactNode> = {
    "hermes-cli": <Terminal className={cls} />,
    "browser": <Globe className={cls} />,
    "web": <Globe className={cls} />,
    "file": <FileText className={cls} />,
    "terminal": <Terminal className={cls} />,
    "code_exec": <Code2 className={cls} />,
    "memory": <Brain className={cls} />,
    "vision": <Eye className={cls} />,
    "image_gen": <Image className={cls} />,
    "tts": <Volume2 className={cls} />,
    "transcription": <Mic className={cls} />,
    "delegate": <Users className={cls} />,
    "kanban": <Kanban className={cls} />,
    "skills": <Box className={cls} />,
    "cron": <Clock className={cls} />,
    "discord": <MessageCircle className={cls} />,
    "homeassistant": <Home className={cls} />,
    "feishu": <FileType className={cls} />,
    "yuanbao": <Bot className={cls} />,
  };
  return <>{icons[name] || <Wrench className={cls} />}</>;
}

export default function SkillsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Wrench className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">技能工具</h1>
          <p className="text-xs text-muted-foreground">Hermes Agent 技能市场与工具注册表</p>
        </div>
      </div>

      <Tabs defaultValue="skills">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="skills">
            <Package className="h-3.5 w-3.5" />
            技能市场
            <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0 h-4">26类</Badge>
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="h-3.5 w-3.5" />
            工具注册表
            <Badge variant="secondary" className="ml-1.5 text-[0.6rem] px-1 py-0 h-4">19组</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Skills tab — card grid */}
        <TabsContent value="skills">
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4 text-sm text-muted-foreground">
              <p>技能是预定义的指令集，扩展 Hermes 的专业能力。从 26 个分类中浏览数百个技能。</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                技能市场连接多个 Hub 源：官方内置、GitHub、ClawHub、LobeHub 等
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SKILL_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="glass-panel rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {cat.label}
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {cat.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0 h-4">
                          {cat.count} 个技能
                        </Badge>
                        <span className="text-[0.6rem] text-muted-foreground/50 font-mono">{cat.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tools tab — card grid */}
        <TabsContent value="tools">
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4 text-sm text-muted-foreground">
              <p>工具是 Hermes 可调用的功能单元，按 toolsets 分组管理。每个工具注册了 OpenAI Function-Calling Schema。</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                总计 50+ 个工具，通过工具集启用/禁用
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLSETS.map((ts) => (
                <div
                  key={ts.name}
                  className={cn(
                    "glass-panel rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer group",
                    !ts.bundled && "ring-1 ring-amber-500/15"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 shrink-0 group-hover:bg-primary/12 transition-colors">
                      <ToolsetIcon name={ts.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-medium text-foreground font-mono truncate group-hover:text-primary transition-colors">
                          {ts.name}
                        </span>
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                        {ts.description}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0 h-4">
                          {ts.count} 工具
                        </Badge>
                        {ts.bundled ? (
                          <Badge variant="secondary" className="text-[0.55rem] px-1 py-0 h-4">内置</Badge>
                        ) : (
                          <Badge className="text-[0.55rem] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            可选
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
