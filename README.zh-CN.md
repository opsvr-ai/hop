# hop

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/English-README-lightgrey?style=for-the-badge" alt="English"></a>
  <a href="https://github.com/opsvr-ai/hop/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"></a>
</p>

**hop** 是一个对话式 AI 代理，集成了 Web 管理面板、用户与空间管理、以及多平台消息网关——全部在一个二进制文件中。可以在 $5 的 VPS 或 GPU 集群上运行，通过 Telegram、Discord 或浏览器与你对话，并按用户和空间隔离对话。

它基于 Nous Research 的 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 引擎构建，并增加了 Next.js Web 前端，支持身份认证、团队空间和管理面板。

## 功能特性

| 类别 | 说明 |
|------|------|
| **AI 代理** | 完整 TUI，支持多行编辑、斜杠命令自动补全、对话历史。自进化学习闭环——从经验中创建技能，在使用中改进技能。FTS5 会话搜索配合 LLM 摘要。 |
| **Web 管理面板** | Next.js 16 聊天界面，玻璃拟态设计。实时流式响应、对话历史、快捷操作卡片。 |
| **用户与空间** | 支持 LDAP 或本地账号的多用户系统。团队空间，支持 owner/admin/member 角色。邀请链接。首次登录自动创建个人空间。 |
| **多平台支持** | Telegram、Discord、Slack、WhatsApp、Signal 和 CLI——全部通过单个网关进程运行。跨平台对话连续性。 |
| **定时调度** | 自然语言定时任务，支持向任意平台投递。日报、夜间备份——无人值守运行。 |
| **任务委派** | 生成隔离子代理处理并行工作流。通过 RPC 调用工具的 Python 脚本。 |
| **任意模型** | OpenRouter（200+ 模型）、OpenAI、Nous Portal、NovitaAI、NVIDIA NIM、小米 MiMo、z.ai/GLM、Kimi、MiniMax、Hugging Face 或自定义端点。一条命令切换——无需改代码。 |
| **随处运行** | 七种终端后端——本地、Docker、SSH、Singularity、Modal、Daytona、Vercel Sandbox。Serverless 持久化，代理空闲时休眠、按需唤醒。 |

## 架构

```
hop/
├── run_agent.py              # AIAgent — 核心对话循环
├── cli.py                    # 交互式 TUI (prompt_toolkit)
├── gateway/                  # 消息网关 + API 服务器
│   ├── run.py                # GatewayRunner — 平台生命周期管理
│   └── platforms/            # Telegram、Discord、Slack、WhatsApp、API 服务器
├── hermes_state.py           # SQLite 会话数据库（FTS5 全文搜索）
├── tools/                    # 40+ 工具（自注册机制）
├── skills/                   # 内置 AI 技能
└── web/                      # Next.js 16 Web 管理面板
    ├── src/app/              # App Router 页面（聊天、管理、设置）
    ├── src/components/       # UI 组件（聊天、布局、认证）
    └── prisma/               # 数据库 Schema（用户、空间、账号）
```

Python 后端负责代理、网关和 API。`web/` 中的 Next.js 前端提供聊天管理面板，通过 NextAuth 认证用户，并将代理请求转发到后端 API 服务器。

## 快速安装

### Linux、macOS、WSL2

```bash
curl -fsSL https://raw.githubusercontent.com/opsvr-ai/hop/main/scripts/install.sh | bash
```

### Windows (PowerShell) — 早期测试版

```powershell
irm https://raw.githubusercontent.com/opsvr-ai/hop/main/scripts/install.ps1 | iex
```

安装后：

```bash
source ~/.bashrc
hop              # 启动 CLI
```

## 快速入门

```bash
hop              # 交互式 CLI — 开始对话
hop model        # 选择 LLM 提供商和模型
hop gateway      # 启动消息网关 + API 服务器
hop setup        # 运行完整设置向导
hop web          # 启动 Web 管理面板（Next.js 开发服务器）
hop update       # 更新到最新版本
```

## Web 管理面板设置

Web 管理面板需要 API 服务器在运行：

```bash
# 终端 1：启动网关（包含 API 服务器，端口 8642）
hop gateway

# 终端 2：启动 Web 前端
cd web
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 并登录。首次运行时，设置页面会创建初始管理员账号。

详细 Web 开发说明请参阅 `web/README.md`。

## 文档

| 章节 | 内容 |
|------|------|
| [架构](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture) | 项目结构、代理循环、关键类 |
| [CLI 使用](https://hermes-agent.nousresearch.com/docs/user-guide/cli) | 命令、快捷键、人格、会话 |
| [配置](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) | 配置文件、提供商、模型、所有选项 |
| [消息网关](https://hermes-agent.nousresearch.com/docs/user-guide/messaging) | Telegram、Discord、Slack、WhatsApp、Signal |
| [工具与工具集](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools) | 40+ 工具、工具集系统、终端后端 |
| [定时调度](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) | 定时任务与平台投递 |

> **注意：** 核心代理文档位于 [hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com/docs/)。Web 管理面板和用户/空间管理文档在本仓库的 `web/` 和 `docs/` 目录下。

## 贡献

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 社区

- 🐛 [问题反馈](https://github.com/opsvr-ai/hop/issues)

## 许可证

MIT — 详见 [LICENSE](LICENSE)。

基于 Nous Research 的 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 构建。
