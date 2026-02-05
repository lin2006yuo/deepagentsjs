import { ProxyAgent, setGlobalDispatcher } from "undici";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// 设置全局代理，影响所有 fetch
setGlobalDispatcher(new ProxyAgent("http://127.0.0.1:8899"));

import "dotenv/config";

import express from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

import researchRouter from "./routes/research.js";
import filesystemRouter from "./routes/filesystem.js";
import memoryRouter from "./routes/memory.js";
import skillsRouter from "./routes/skills.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directories exist
const dataDir = path.join(__dirname, "../../data");
const dirs = ["sessions", "workspace", "memory", "skills"];
dirs.forEach((dir) => {
  const dirPath = path.join(dataDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/research", researchRouter);
app.use("/api/filesystem", filesystemRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/skills", skillsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString(),
    });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 DeepAgents Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - Research: http://localhost:${PORT}/api/research`);
  console.log(`   - Filesystem: http://localhost:${PORT}/api/filesystem`);
  console.log(`   - Memory: http://localhost:${PORT}/api/memory`);
  console.log(`   - Skills: http://localhost:${PORT}/api/skills`);
});
