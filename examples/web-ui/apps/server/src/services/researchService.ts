import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import type { ResearchStreamChunk, ResearchSession } from "@deepagents/shared";
import { generateId } from "@deepagents/shared";
import { knowledgeBackend } from "./backendService.js";

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
export async function streamResearch(
  options: StreamResearchOptions,
): Promise<void> {
  const {
    question,
    sessionId: existingSessionId,
    onChunk,
    abortSignal,
  } = options;

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
  onChunk({
    type: "phase",
    phase: PHASES[0].id,
    phaseName: PHASES[0].name,
    phaseIcon: PHASES[0].icon,
  });

  // Phase 1: Initialization
  await delay(300);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: "正在分析研究问题..." });

  await delay(300);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: `研究主题: ${question}` });

  // Phase 2: Knowledge Search
  onChunk({
    type: "phase",
    phase: PHASES[1].id,
    phaseName: PHASES[1].name,
    phaseIcon: PHASES[1].icon,
  });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({
    type: "tool_call",
    toolName: "knowledge_base_search",
    toolData: { query: question },
  });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({ type: "thinking", content: "正在搜索本地知识库..." });

  // Use backend to search relevant content
  const relevantFiles: Array<{ name: string; content: string }> = [];

  // Try to search for relevant content using grep
  const searchPattern = question
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .join("|");

  if (searchPattern) {
    try {
      const grepResults = await knowledgeBackend.grepRaw(
        searchPattern,
        "/",
        "*.md",
      );

      if (typeof grepResults !== "string" && grepResults.length > 0) {
        // Get unique file paths from search results
        const matchedFiles = [...new Set(grepResults.map((m) => m.path))].slice(
          0,
          3,
        );

        onChunk({
          type: "thinking",
          content: `找到 ${matchedFiles.length} 个相关文档`,
        });

        // Read content of matched files
        for (const filePath of matchedFiles) {
          await delay(300);
          if (abortSignal.aborted) throw new Error("AbortError");

          const fileName = filePath.split("/").pop() || filePath;
          onChunk({
            type: "tool_call",
            toolName: "read_file",
            toolData: { file: fileName },
          });

          try {
            const content = await knowledgeBackend.read(filePath);
            if (!content.startsWith("Error")) {
              relevantFiles.push({ name: fileName, content });
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    } catch {
      // Fallback to listing all files if grep fails
    }
  }

  // If no relevant files found, list all knowledge files
  if (relevantFiles.length === 0) {
    try {
      const allFiles = await knowledgeBackend.lsInfo("/");
      const mdFiles = allFiles.filter(
        (f) => !f.is_dir && f.path.endsWith(".md"),
      );

      onChunk({
        type: "thinking",
        content: `发现 ${mdFiles.length} 个知识库文档`,
      });

      for (const fileInfo of mdFiles.slice(0, 3)) {
        await delay(300);
        if (abortSignal.aborted) throw new Error("AbortError");

        const fileName = fileInfo.path.split("/").pop() || fileInfo.path;
        onChunk({
          type: "tool_call",
          toolName: "read_file",
          toolData: { file: fileName },
        });

        try {
          const content = await knowledgeBackend.read(fileInfo.path);
          if (!content.startsWith("Error")) {
            relevantFiles.push({ name: fileName, content });
          }
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Phase 3: Analysis
  onChunk({
    type: "phase",
    phase: PHASES[2].id,
    phaseName: PHASES[2].name,
    phaseIcon: PHASES[2].icon,
  });

  await delay(400);
  if (abortSignal.aborted) throw new Error("AbortError");
  onChunk({
    type: "subagent",
    content: "启动研究子代理...",
    subAgentName: "analyzer",
  });

  // Add todos
  const todos = [
    { content: "搜索知识库文档", status: "completed" },
    { content: "分析研究主题", status: "in_progress" },
    { content: "生成研究报告", status: "pending" },
  ];

  for (const todo of todos) {
    await delay(200);
    if (abortSignal.aborted) throw new Error("AbortError");
    onChunk({
      type: "todo",
      content: `任务: ${todo.content} [${todo.status}]`,
    });
  }

  // Phase 4: Report Generation
  onChunk({
    type: "phase",
    phase: PHASES[3].id,
    phaseName: PHASES[3].name,
    phaseIcon: PHASES[3].icon,
  });

  await delay(500);
  if (abortSignal.aborted) throw new Error("AbortError");

  // Generate report based on actual file contents
  const sourceFiles = relevantFiles.map((f) => f.name).join("\n- ");
  const fileContents = relevantFiles
    .map((f) => `### ${f.name}\n\n${f.content.substring(0, 2000)}`)
    .join("\n\n");

  const report = `# 研究报告: ${question}

## 概述

本报告基于本地知识库对 "${question}" 进行了深入研究。

## 知识库文档

研究过程中读取了以下文档：
- ${sourceFiles || "无"}

## 文档内容摘要

${fileContents || "未找到相关文档内容"}

## 结论

基于知识库文档的分析，研究已完成。具体内容请参考上述文档。

## 来源

${sourceFiles || "-"}
`;

  onChunk({ type: "report", content: report });

  // Phase 5: Completed
  onChunk({
    type: "phase",
    phase: PHASES[4].id,
    phaseName: PHASES[4].name,
    phaseIcon: PHASES[4].icon,
  });

  // Update session
  session.status = "completed";
  session.updatedAt = Date.now();
  session.report = report;
  session.todos = todos;
  saveSession(session);

  // Send done
  onChunk({ type: "done" });
}

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
