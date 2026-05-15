"use client";

import { useState } from "react";
import { Wrench, Package, Download, Star, Shield, AlertCircle, Box, Cpu, Globe, FileText, Terminal, Code2, Brain, Eye, Image, Volume2, Mic, Users, Kanban, Clock, MessageCircle, Home, FileType, Bot, ArrowRight, Zap, Search, BarChart3, GitBranch, Settings2, Pen, Hash, Video, Music, Camera, ListTodo, Key, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

/** Sample skill names per category for the detail view */
function getSampleSkills(categoryName: string): string[] {
  const samples: Record<string, string[]> = {
    "software-development": ["代码审查与优化", "单元测试生成", "API 设计助手", "重构建议", "调试分析", "架构评审"],
    "devops": ["Docker 容器化部署", "CI/CD 流水线配置", "Kubernetes 集群管理", "日志聚合分析", "监控告警配置", "基础设施即代码"],
    "data-science": ["数据清洗管道", "特征工程", "模型训练与评估", "数据可视化仪表板", "A/B 测试分析", "时间序列预测"],
    "productivity": ["日常任务自动化", "会议纪要生成", "文档格式化", "邮件批量处理", "日程智能安排", "工作流模板"],
    "github": ["PR 描述生成", "Issue 自动分类", "代码变更审查", "Release Notes 生成", "贡献者指南检查"],
    "research": ["文献综述撰写", "研究大纲生成", "引用格式管理", "实验设计建议", "数据分析报告"],
    "autonomous-ai-agents": ["多代理任务编排", "子代理角色定义", "代理间通信协议", "任务拆分与委派", "代理行为监控"],
    "creative": ["文案创作", "品牌故事生成", "视觉设计建议", "视频脚本撰写", "社交媒体内容"],
    "media": ["视频剪辑建议", "音频降噪处理", "图像批量编辑", "字幕生成", "格式转换"],
    "note-taking": ["知识图谱构建", "笔记自动分类", "摘要提取", "关联笔记推荐", "Markdown 格式化"],
    "social-media": ["推文优化", "发布时间建议", "话题标签推荐", "互动数据分析", "内容日历规划"],
    "email": ["邮件模板生成", "收件箱优先级排序", "自动回复设置", "邮件追踪", "批量个性化发送"],
  };
  return samples[categoryName] || ["示例技能 1", "示例技能 2", "示例技能 3"];
}

/** Sample tool names per toolset for the detail view */
function getSampleTools(toolsetName: string): { name: string; desc: string }[] {
  const samples: Record<string, { name: string; desc: string }[]> = {
    "hermes-cli": [
      { name: "run_command", desc: "执行 CLI 命令并返回结构化输出" },
      { name: "get_config", desc: "读取当前配置项和默认值" },
      { name: "set_config", desc: "动态修改运行配置" },
      { name: "session_new", desc: "创建新的对话会话" },
      { name: "session_list", desc: "列出所有历史会话" },
    ],
    "browser": [
      { name: "browser_navigate", desc: "导航到指定 URL" },
      { name: "browser_click", desc: "点击页面元素" },
      { name: "browser_screenshot", desc: "截取页面可见区域或全页" },
      { name: "browser_extract", desc: "提取页面结构化内容" },
    ],
    "web": [
      { name: "web_search", desc: "执行网页搜索并返回结果" },
      { name: "web_fetch", desc: "抓取指定 URL 的内容" },
    ],
    "file": [
      { name: "file_read", desc: "读取文件内容（支持分页）" },
      { name: "file_write", desc: "写入文件内容" },
      { name: "file_edit", desc: "精确文本替换编辑" },
    ],
    "terminal": [{ name: "terminal_exec", desc: "执行终端命令并捕获输出" }],
    "code_exec": [{ name: "code_exec_python", desc: "在沙箱中运行 Python 代码" }],
    "memory": [{ name: "memory_store", desc: "存储键值对到持久化记忆" }],
    "vision": [
      { name: "vision_analyze", desc: "分析图像内容并返回描述" },
      { name: "vision_ocr", desc: "从图像中提取文本" },
    ],
    "image_gen": [{ name: "image_generate", desc: "根据提示词生成图像" }],
    "tts": [{ name: "tts_synthesize", desc: "将文本转换为语音" }],
    "transcription": [{ name: "audio_transcribe", desc: "将音频转录为文本" }],
    "delegate": [{ name: "delegate_task", desc: "将子任务委派给专业代理" }],
    "kanban": [{ name: "kanban_create", desc: "创建看板任务卡片" }],
    "skills": [
      { name: "skill_install", desc: "从 Hub 安装技能" },
      { name: "skill_list", desc: "列出已安装的技能" },
      { name: "skill_enable", desc: "启用指定技能" },
      { name: "skill_disable", desc: "禁用指定技能" },
    ],
    "cron": [{ name: "cron_schedule", desc: "创建定时任务" }],
    "discord": [{ name: "discord_send", desc: "发送消息到 Discord 频道" }],
    "homeassistant": [{ name: "ha_control", desc: "控制 HomeAssistant 设备" }],
    "feishu": [
      { name: "feishu_read_doc", desc: "读取飞书文档内容" },
      { name: "feishu_write_sheet", desc: "写入飞书多维表格" },
    ],
    "yuanbao": [{ name: "yuanbao_chat", desc: "调用腾讯元宝模型生成回复" }],
  };
  return samples[toolsetName] || [{ name: "tool_example", desc: "示例工具描述" }];
}

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState<"skill" | "toolset">("skill");
  const [detailData, setDetailData] = useState<Record<string, unknown>>({});

  function openSkillDetail(cat: (typeof SKILL_CATEGORIES)[number]) {
    setDetailType("skill");
    setDetailData(cat as unknown as Record<string, unknown>);
    setDetailOpen(true);
  }

  function openToolsetDetail(ts: (typeof TOOLSETS)[number]) {
    setDetailType("toolset");
    setDetailData(ts as unknown as Record<string, unknown>);
    setDetailOpen(true);
  }

  const detailSkills = detailType === "skill" ? getSampleSkills(detailData.name as string) : [];
  const detailTools = detailType === "toolset" ? getSampleTools(detailData.name as string) : [];

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
                <button
                  key={cat.name}
                  onClick={() => openSkillDetail(cat)}
                  className="glass-panel rounded-xl p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] group"
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
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0 mt-1.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
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
                <button
                  key={ts.name}
                  onClick={() => openToolsetDetail(ts)}
                  className={cn(
                    "glass-panel rounded-xl p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] group",
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
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0 mt-1.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              {detailType === "skill" ? (
                <span className="text-2xl">{detailData.icon as string}</span>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ToolsetIcon name={detailData.name as string} />
                </div>
              )}
              <span>{(detailData.label || detailData.name) as string}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {(detailData.desc || detailData.description) as string}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Meta badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {detailType === "skill" ? (
                <>
                  <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5">
                    {(detailData.count as number) ?? 0} 个技能
                  </Badge>
                  <Badge variant="outline" className="text-[0.65rem] px-2 py-0.5 font-mono">
                    {detailData.name as string}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-[0.65rem] px-2 py-0.5">
                    {(detailData.count as number) ?? 0} 工具
                  </Badge>
                  {(detailData.bundled as boolean) ? (
                    <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5">内置</Badge>
                  ) : (
                    <Badge className="text-[0.65rem] px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      可选安装
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[0.65rem] px-2 py-0.5 font-mono">
                    {detailData.name as string}
                  </Badge>
                </>
              )}
            </div>

            {/* List of items */}
            {detailType === "skill" && (
              <div>
                <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  包含的技能
                </h3>
                <div className="space-y-1.5">
                  {detailSkills.map((skill, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <Zap className="h-3 w-3 text-primary/50 shrink-0" />
                      <span className="text-foreground/80">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailType === "toolset" && (
              <div>
                <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-muted-foreground" />
                  注册的工具
                </h3>
                <div className="space-y-1.5">
                  {detailTools.map((tool, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-lg border border-border/40 px-3 py-2.5 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/8 shrink-0 mt-0.5">
                        <Code2 className="h-3 w-3 text-primary/60" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-foreground/80 font-medium">{tool.name}</div>
                        <div className="text-muted-foreground mt-0.5">{tool.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integration note */}
            <div className="rounded-lg bg-muted/50 border border-border/30 px-3 py-2.5 text-[0.65rem] text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Search className="h-3 w-3 shrink-0" />
                数据来源于 Hermes Agent 技能注册表和工具清单，实际可用内容可能因版本而异。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
