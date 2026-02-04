## 技术方案

### 整体架构

采用前后端分离架构：

* **前端**: React + TypeScript + Vite + TailwindCSS + shadcn/ui

* **后端**: Express + TypeScript，整合 deepagents 多种能力

### 核心功能模块

基于你提供的示例，Web UI 将支持以下能力：

1. **Research Agent** (`examples/research/`) - 本地知识库研究

   * 基于本地知识库的研究问答

   * 生成研究报告 (final\_report.md)

   * 子 Agent 并行研究

2. **Filesystem Backend** (`examples/backends/`) - 文件系统操作

   * 读写文件

   * 代码生成与编辑

   * 工作区文件管理

3. **Memory Agent** (`examples/memory/`) - 持久化上下文

   * AGENTS.md 项目记忆

   * 代码风格指南

   * 构建命令记忆

4. **Skills + Memory** (`examples/skills-memory/`) - 技能系统

   * SKILL.md 技能发现

   * 长期记忆存储

   * 项目级和用户级配置

### 目录结构

```
/Users/linxueyu/studio/deepagentsjs/examples/web-ui/          # 统一 Web UI 目录
├── package.json                    # 工作区根配置
├── pnpm-workspace.yaml            # pnpm 工作区
├── tsconfig.json                   # 根 TS 配置
│
├── apps/
│   ├── web/                       # 前端 (React + Vite)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── ui/            # shadcn 基础组件
│   │       │   ├── layout/
│   │       │   │   ├── Sidebar.tsx      # 侧边导航
│   │       │   │   ├── Header.tsx       # 顶部栏
│   │       │   │   └── MainLayout.tsx   # 主布局
│   │       │   ├── research/
│   │       │   │   ├── ResearchChat.tsx     # 研究对话
│   │       │   │   ├── ReportViewer.tsx     # 报告查看
│   │       │   │   ├── KnowledgePanel.tsx   # 知识库面板
│   │       │   │   └── TodoList.tsx         # 任务列表
│   │       │   ├── filesystem/
│   │       │   │   ├── FileExplorer.tsx     # 文件浏览器
│   │       │   │   ├── FileEditor.tsx       # 文件编辑器
│   │       │   │   └── WorkspacePanel.tsx   # 工作区面板
│   │       │   ├── memory/
│   │       │   │   ├── MemoryPanel.tsx      # 记忆管理
│   │       │   │   └── AgentsMdViewer.tsx   # AGENTS.md 查看
│   │       │   └── skills/
│   │       │       ├── SkillList.tsx        # 技能列表
│   │       │       └── SkillDetail.tsx      # 技能详情
│   │       ├── hooks/
│   │       │   ├── useResearch.ts
│   │       │   ├── useFilesystem.ts
│   │       │   ├── useMemory.ts
│   │       │   └── useSkills.ts
│   │       ├── services/
│   │       │   └── api.ts
│   │       ├── stores/
│   │       │   ├── researchStore.ts
│   │       │   ├── filesystemStore.ts
│   │       │   └── appStore.ts
│   │       └── types/
│   │           └── index.ts
│   │
│   └── server/                    # 后端 (Express)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts               # 服务入口
│           ├── routes/
│           │   ├── research.ts        # 研究 API
│           │   ├── filesystem.ts      # 文件系统 API
│           │   ├── memory.ts          # 记忆 API
│           │   └── skills.ts          # 技能 API
│           ├── services/
│           │   ├── researchService.ts     # 封装 research-agent.ts
│           │   ├── filesystemService.ts   # 封装 filesystem-backend.ts
│           │   ├── memoryService.ts       # 封装 memory-agent.ts
│           │   └── skillsService.ts       # 封装 skills-memory-agent.ts
│           └── middleware/
│               ├── sse.ts             # SSE 流式响应
│               └── errorHandler.ts    # 错误处理
│
├── packages/
│   └── shared/                    # 共享类型和工具
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── research.ts
│           │   ├── filesystem.ts
│           │   └── index.ts
│           └── utils/
│               └── index.ts
│
└── data/                          # 数据存储
    ├── sessions/                  # 会话历史
    ├── workspace/                 # 文件系统工作区
    ├── knowledge/                 # 知识库 (复用 examples/research/knowledge/)
    ├── memory/                    # 记忆存储
    │   └── agents.md              # 项目级 AGENTS.md
    └── skills/                    # 技能目录
        ├── web-research/
        │   └── SKILL.md
        └── code-review/
            └── SKILL.md
```

### API 设计

```typescript
// ===== Research API =====
// POST /api/research/stream
interface ResearchRequest {
  question: string;
  sessionId?: string;
  knowledgeBase?: string[];  // 指定知识库文件
}

interface ResearchStreamChunk {
  type: 'thinking' | 'tool_call' | 'subagent' | 'report' | 'todo' | 'done' | 'error';
  content?: string;
  toolName?: string;
  subAgentName?: string;
  todo?: { content: string; status: string };
  error?: string;
}

// GET /api/research/knowledge - 获取知识库文件列表
// GET /api/research/report/:sessionId - 获取研究报告

// ===== Filesystem API =====
// GET /api/fs/files?path=... - 列出文件
// GET /api/fs/files/content?path=... - 读取文件
// POST /api/fs/files - 创建/写入文件
// PUT /api/fs/files - 编辑文件
// DELETE /api/fs/files - 删除文件

// ===== Memory API =====
// GET /api/memory - 获取当前记忆
// POST /api/memory - 更新记忆
// GET /api/memory/agents-md - 获取 AGENTS.md 内容

// ===== Skills API =====
// GET /api/skills - 获取技能列表
// GET /api/skills/:name - 获取技能详情
// POST /api/skills/:name/invoke - 调用技能
```

### 页面路由设计

```
/                           # 首页 - 功能概览
/research                   # 研究模式 (research-agent.ts)
  └── /research/:sessionId  # 具体研究会话
/filesystem                 # 文件系统模式 (filesystem-backend.ts)
  └── /filesystem/:path     # 浏览具体路径
/memory                     # 记忆管理 (memory-agent.ts)
/skills                     # 技能中心 (skills-memory-agent.ts)
/settings                   # 设置页面
```

### 启动方式

```bash
# 根目录
pnpm install
pnpm dev              # 同时启动前端和后端

# 或分别启动
pnpm dev:web          # 前端 http://localhost:5173
pnpm dev:server       # 后端 http://localhost:3001
```

### 与原示例的关系

| 原示例                       | Web UI 对应功能               |
| ------------------------- | ------------------------- |
| `examples/research/`      | `/research` 路由，研究对话界面     |
| `examples/backends/`      | `/filesystem` 路由，文件浏览器    |
| `examples/memory/`        | `/memory` 路由，AGENTS.md 管理 |
| `examples/skills-memory/` | `/skills` 路由，技能中心         |
| `examples/knowledge/`     | 复用为知识库数据源                 |

### 技术栈

* **前端**: React 19 + TypeScript + Vite + TailwindCSS + shadcn/ui + Zustand + React Router

* **后端**: Express + TypeScript + deepagents (本地库引用)

* **构建**: pnpm workspace + tsx (开发)

