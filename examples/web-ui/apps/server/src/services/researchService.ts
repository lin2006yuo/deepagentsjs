import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import type { ResearchStreamChunk, ResearchSession } from "@deepagents/shared";
import { generateId } from "@deepagents/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data paths
const SESSIONS_PATH = path.join(__dirname, "../../data/sessions");
const KNOWLEDGE_PATH = path.join(__dirname, "../../data/knowledge");

// Ensure directories exist
if (!fs.existsSync(SESSIONS_PATH)) {
  fs.mkdirSync(SESSIONS_PATH, { recursive: true });
}

interface StreamResearchOptions {
  question: string;
  sessionId?: string;
  knowledgeBase?: string[];
  onChunk: (chunk: ResearchStreamChunk) => void;
  abortSignal: AbortSignal;
}

// Research phases
const PHASES = [
  { id: "initialization", name: "初始化", icon: "🚀" },
  { id: "knowledge_search", name: "知识搜索", icon: "🔍" },
  { id: "analysis", name: "深度分析", icon: "🧠" },
  { id: "report_generation", name: "报告生成", icon: "📝" },
  { id: "completed", name: "完成", icon: "✅" },
] as const;

// Save session to disk
function saveSession(session: ResearchSession): void {
  const filePath = path.join(SESSIONS_PATH, `${session.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
}

// Load session from disk
function loadSession(sessionId: string): ResearchSession | null {
  const filePath = path.join(SESSIONS_PATH, `${sessionId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// Simulate research process
export async function streamResearch(options: StreamResearchOptions): Promise<void> {
  const { question, sessionId: existingSessionId, onChunk, abortSignal } = options;

  // Create or load session
  const sessionId = existingSessionId || generateId();
  let session = loadSession(sessionId);

  if (!session) {
    session = {
      id: sessionId,
      question,
      status: "running",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      todos: [],
    };
  } else {
    session.status = "running";
    session.updatedAt = Date.now();
  }

  saveSession(session);

  // Send initial phase
  onChunk({ type: "phase", phase: PHASES[0].id, phaseName: PHASES[0].name, phaseIcon: PHASES[0].icon });

  // Phase 1: Initialization
  await delay(300);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: "正在分析研究问题..." });

  await delay(300);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: `研究主题: ${question}` });

  // Phase 2: Knowledge Search
  onChunk({ type: "phase", phase: PHASES[1].id, phaseName: PHASES[1].name, phaseIcon: PHASES[1].icon });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "tool_call", toolName: "knowledge_base_search", toolData: { query: question } });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: "正在搜索本地知识库..." });

  // Check knowledge base files
  let knowledgeFiles: string[] = [];
  if (fs.existsSync(KNOWLEDGE_PATH)) {
    knowledgeFiles = fs.readdirSync(KNOWLEDGE_PATH).filter((f) => f.endsWith(".md"));
  }

  if (knowledgeFiles.length > 0) {
    await delay(300);
    if (abortSignal.aborted) throw new Error("AbortError");
    onChunk({ type: "thinking", content: `发现 ${knowledgeFiles.length} 个知识库文档` });

    for (const file of knowledgeFiles.slice(0, 3)) {
      await delay(300);
      if (abortSignal.aborted) throw new Error("AbortError");
      onChunk({ type: "tool_call", toolName: "read_file", toolData: { file } });
    }
  }

  // Phase 3: Analysis
  onChunk({ type: "phase", phase: PHASES[2].id, phaseName: PHASES[2].name, phaseIcon: PHASES[2].icon });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "subagent", content: "启动研究子代理...", subAgentName: "analyzer" });

  // Add todos
  const todos = [
    { content: "搜索知识库文档", status: "completed" },
    { content: "分析研究主题", status: "in_progress" },
    { content: "生成研究报告", status: "pending" },
  ];

  for (const todo of todos) {
    await delay(200);
    if (abortSignal.aborted) throw new Error("AbortError");
    onChunk({ type: "todo", content: `任务: ${todo.content} [${todo.status}]` });
  }

  // Phase 4: Report Generation
  onChunk({ type: "phase", phase: PHASES[3].id, phaseName: PHASES[3].name, phaseIcon: PHASES[3].icon });

  await delay(500);
  if (abortSignal.aborted) throw new Error("AbortError");

  // Generate mock report
  const mockReport = `# 研究报告: ${question}

## 概述

本报告基于本地知识库对 "${question}" 进行了深入研究。

## 研究发现

### 1. 核心概念

根据知识库文档，我们发现以下关键信息：

- **LangGraph**: 一个用于构建复杂 AI 代理工作流的框架
- **Deep Agents**: 基于 LangGraph 的高级代理库
- **AI Agent 模式**: 包括 ReAct、Plan-and-Execute 等设计模式

### 2. 技术细节

#### LangGraph 特性
- 支持状态管理
- 图结构工作流
- 人机协同 (HITL)

#### Deep Agents 能力
- 子代理系统
- 技能管理
- 记忆持久化

## 结论

研究表明，使用 LangGraph 和 Deep Agents 可以构建强大的 AI 代理系统。

## 来源

- langgraph-intro.md
- deep-agents-guide.md
- ai-agent-patterns.md
`;

  onChunk({ type: "report", content: mockReport });

  // Phase 5: Completed
  onChunk({ type: "phase", phase: PHASES[4].id, phaseName: PHASES[4].name, phaseIcon: PHASES[4].icon });

  // Update session
  session.status = "completed";
  session.updatedAt = Date.now();
  session.report = mockReport;
  session.todos = todos;
  saveSession(session);

  // Send done
  onChunk({ type: "done" });
}

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
