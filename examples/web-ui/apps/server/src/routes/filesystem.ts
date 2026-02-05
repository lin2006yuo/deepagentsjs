import { Router } from "express";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod/v4";
import type { FileInfo, FileContent } from "@deepagents/shared";
import { backend, knowledgeBackend } from "../services/backendService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: Router = Router();

// Workspace root path
const WORKSPACE_PATH = path.join(__dirname, "../../data/workspace");

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_PATH)) {
  fs.mkdirSync(WORKSPACE_PATH, { recursive: true });
}

// Security helper - ensure path is within workspace
function resolveWorkspacePath(relativePath: string): string | null {
  const resolved = path.resolve(WORKSPACE_PATH, relativePath);
  if (!resolved.startsWith(WORKSPACE_PATH)) {
    return null;
  }
  return resolved;
}

// GET /api/filesystem/list - List files in directory
router.get("/list", (req, res) => {
  try {
    const relativePath = (req.query.path as string) || ".";
    const dirPath = resolveWorkspacePath(relativePath);

    if (!dirPath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(dirPath)) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: FileInfo[] = entries.map((entry) => {
      const entryPath = path.join(dirPath, entry.name);
      const stat = fs.statSync(entryPath);
      return {
        name: entry.name,
        path: path.relative(WORKSPACE_PATH, entryPath),
        isDirectory: entry.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime.getTime(),
      };
    });

    res.json({ path: relativePath, files });
  } catch (error) {
    res.status(500).json({ error: "Failed to list directory" });
  }
});

// GET /api/filesystem/content - Get file content
router.get("/content", (req, res) => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) {
      res.status(400).json({ error: "Path is required" });
      return;
    }

    const filePath = resolveWorkspacePath(relativePath);
    if (!filePath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      res.status(400).json({ error: "Path is a directory" });
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const fileContent: FileContent = {
      path: relativePath,
      content,
      encoding: "utf-8",
    };

    res.json(fileContent);
  } catch (error) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

// POST /api/filesystem/write - Write file
const writeSchema = z.object({
  path: z.string(),
  content: z.string(),
});

router.post("/write", (req, res) => {
  try {
    const result = writeSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: "Invalid request", details: result.error.issues });
      return;
    }

    const { path: relativePath, content } = result.data;
    const filePath = resolveWorkspacePath(relativePath);

    if (!filePath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    res.json({ success: true, path: relativePath });
  } catch (error) {
    res.status(500).json({ error: "Failed to write file" });
  }
});

// DELETE /api/filesystem/delete - Delete file or directory
router.delete("/delete", (req, res) => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) {
      res.status(400).json({ error: "Path is required" });
      return;
    }

    const filePath = resolveWorkspacePath(relativePath);
    if (!filePath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, path: relativePath });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// POST /api/filesystem/mkdir - Create directory
const mkdirSchema = z.object({
  path: z.string(),
});

router.post("/mkdir", (req, res) => {
  try {
    const result = mkdirSchema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ error: "Invalid request", details: result.error.issues });
      return;
    }

    const { path: relativePath } = result.data;
    const dirPath = resolveWorkspacePath(relativePath);

    if (!dirPath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    res.json({ success: true, path: relativePath });
  } catch (error) {
    res.status(500).json({ error: "Failed to create directory" });
  }
});

// GET /api/filesystem/grep - Search file content
router.get("/grep", async (req, res) => {
  try {
    const pattern = req.query.pattern as string;
    const searchPath = (req.query.path as string) || "/";
    const glob = req.query.glob as string | null;
    const target = (req.query.target as string) || "workspace"; // 'workspace' or 'knowledge'

    if (!pattern) {
      res.status(400).json({ error: "Pattern is required" });
      return;
    }

    // Use appropriate backend
    const selectedBackend = target === "knowledge" ? knowledgeBackend : backend;

    const results = await selectedBackend.grepRaw(pattern, searchPath, glob);

    if (typeof results === "string") {
      // Error message
      res.status(400).json({ error: results });
      return;
    }

    res.json({
      pattern,
      path: searchPath,
      glob,
      matches: results,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to search files" });
  }
});

// GET /api/filesystem/glob - Find files by pattern
router.get("/glob", async (req, res) => {
  try {
    const pattern = req.query.pattern as string;
    const searchPath = (req.query.path as string) || "/";
    const target = (req.query.target as string) || "workspace";

    if (!pattern) {
      res.status(400).json({ error: "Pattern is required" });
      return;
    }

    const selectedBackend = target === "knowledge" ? knowledgeBackend : backend;
    const results = await selectedBackend.globInfo(pattern, searchPath);

    res.json({
      pattern,
      path: searchPath,
      files: results,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to glob files" });
  }
});

export default router;
