import * as path from "path";
import { fileURLToPath } from "url";
import { FilesystemBackend } from "@deepagents/backends";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workspace root path
const WORKSPACE_PATH = path.join(__dirname, "../../data/workspace");

// Create FilesystemBackend instance
export const backend = new FilesystemBackend({
  rootDir: WORKSPACE_PATH,
  virtualMode: true, // Enable virtual mode for security
  maxFileSizeMb: 10,
});

// Knowledge base path (separate from workspace)
const KNOWLEDGE_PATH = path.join(__dirname, "../../data/knowledge");

export const knowledgeBackend = new FilesystemBackend({
  rootDir: KNOWLEDGE_PATH,
  virtualMode: true,
  maxFileSizeMb: 10,
});
