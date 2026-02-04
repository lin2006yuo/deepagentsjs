import { Router } from "express";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";
import { setupSSE, sendSSE, endSSE } from "../middleware/sse.js";
import * as researchService from "../services/researchService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Knowledge base path
const KNOWLEDGE_PATH = path.join(__dirname, "../../data/knowledge");

// Ensure knowledge directory exists
if (!fs.existsSync(KNOWLEDGE_PATH)) {
  fs.mkdirSync(KNOWLEDGE_PATH, { recursive: true });
}

// Validation schemas
const researchRequestSchema = z.object({
  question: z.string().min(1),
  sessionId: z.string().optional(),
  knowledgeBase: z.array(z.string()).optional(),
});

// GET /api/research/knowledge - List knowledge base files
router.get("/knowledge", (req, res) => {
  try {
    const files: Array<{ name: string; path: string; size: number }> = [];

    if (fs.existsSync(KNOWLEDGE_PATH)) {
      const entries = fs.readdirSync(KNOWLEDGE_PATH);
      for (const entry of entries) {
        const filePath = path.join(KNOWLEDGE_PATH, entry);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          files.push({
            name: entry,
            path: filePath,
            size: stat.size,
          });
        }
      }
    }

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to list knowledge base files" });
  }
});

// GET /api/research/knowledge/:name - Get knowledge file content
router.get("/knowledge/:name", (req, res) => {
  try {
    const fileName = req.params.name;
    const filePath = path.join(KNOWLEDGE_PATH, fileName);

    // Security check - ensure file is within knowledge directory
    if (!filePath.startsWith(KNOWLEDGE_PATH)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ name: fileName, content });
  } catch (error) {
    res.status(500).json({ error: "Failed to read knowledge file" });
  }
});

// GET /api/research/sessions - List research sessions
router.get("/sessions", (req, res) => {
  try {
    const sessionsDir = path.join(__dirname, "../../data/sessions");
    const sessions: Array<{
      id: string;
      question: string;
      status: string;
      createdAt: number;
      updatedAt: number;
    }> = [];

    if (fs.existsSync(sessionsDir)) {
      const files = fs.readdirSync(sessionsDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const data = JSON.parse(
              fs.readFileSync(path.join(sessionsDir, file), "utf-8"),
            );
            sessions.push({
              id: data.id,
              question: data.question,
              status: data.status,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          } catch {
            // Skip invalid files
          }
        }
      }
    }

    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// GET /api/research/sessions/:id - Get session details
router.get("/sessions/:id", (req, res) => {
  try {
    const sessionPath = path.join(
      __dirname,
      "../../data/sessions",
      `${req.params.id}.json`,
    );

    if (!fs.existsSync(sessionPath)) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const session = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: "Failed to get session" });
  }
});

// POST /api/research/stream - Start research with streaming
router.post("/stream", async (req, res) => {
  try {
    const result = researchRequestSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: "Invalid request", details: result.error.errors });
      return;
    }

    const { question, sessionId, knowledgeBase } = result.data;

    setupSSE({ res });

    const abortController = new AbortController();

    res.on("close", () => {
      abortController.abort();
    });

    await researchService.streamResearch({
      question,
      sessionId,
      knowledgeBase,
      onChunk: (chunk) => {
        sendSSE(res, chunk);
      },
      abortSignal: abortController.signal,
    });

    endSSE(res);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      endSSE(res);
      return;
    }
    console.error("Research stream error:", error);
    sendSSE(res, {
      type: "error",
      error: error instanceof Error ? error.message : "Research failed",
    });
    endSSE(res);
  }
});

export default router;
