import { Router } from "express";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod/v4";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Memory storage path
const MEMORY_PATH = path.join(__dirname, "../../data/memory");
const AGENTS_MD_PATH = path.join(MEMORY_PATH, "AGENTS.md");

// Ensure memory directory exists
if (!fs.existsSync(MEMORY_PATH)) {
  fs.mkdirSync(MEMORY_PATH, { recursive: true });
}

// Default AGENTS.md content
const DEFAULT_AGENTS_MD = `---
name: deepagents-project
description: DeepAgents Web UI Project Configuration
---

# Project Configuration

## Code Style
- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Use async/await for asynchronous operations

## Build Commands
- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm typecheck\` - Run TypeScript checks

## Architecture
- Frontend: React + Vite + TailwindCSS
- Backend: Express + DeepAgents
- Monorepo structure with pnpm workspaces
`;

// Initialize AGENTS.md if not exists
if (!fs.existsSync(AGENTS_MD_PATH)) {
  fs.writeFileSync(AGENTS_MD_PATH, DEFAULT_AGENTS_MD, "utf-8");
}

// GET /api/memory - Get memory content
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(AGENTS_MD_PATH)) {
      res.json({ content: "", source: "AGENTS.md", updatedAt: 0 });
      return;
    }

    const content = fs.readFileSync(AGENTS_MD_PATH, "utf-8");
    const stat = fs.statSync(AGENTS_MD_PATH);

    res.json({
      content,
      source: "AGENTS.md",
      updatedAt: stat.mtime.getTime(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to read memory" });
  }
});

// POST /api/memory - Update memory content
const updateSchema = z.object({
  content: z.string(),
});

router.post("/", (req, res) => {
  try {
    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: "Invalid request", details: result.error.issues });
      return;
    }

    const { content } = result.data;
    fs.writeFileSync(AGENTS_MD_PATH, content, "utf-8");

    res.json({
      success: true,
      source: "AGENTS.md",
      updatedAt: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update memory" });
  }
});

// GET /api/memory/files - List all memory files
router.get("/files", (req, res) => {
  try {
    const files: Array<{ name: string; updatedAt: number }> = [];

    if (fs.existsSync(MEMORY_PATH)) {
      const entries = fs.readdirSync(MEMORY_PATH);
      for (const entry of entries) {
        const filePath = path.join(MEMORY_PATH, entry);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          files.push({
            name: entry,
            updatedAt: stat.mtime.getTime(),
          });
        }
      }
    }

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to list memory files" });
  }
});

export default router;
