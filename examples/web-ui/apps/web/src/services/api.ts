import type {
  ResearchRequest,
  ResearchStreamChunk,
  ResearchSession,
  FileInfo,
  FileContent,
  MemoryData,
  SkillInfo,
} from "@deepagents/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ===== Research API =====

export async function fetchKnowledgeFiles(): Promise<
  Array<{ name: string; path: string; size: number }>
> {
  const response = await fetch(`${API_BASE_URL}/research/knowledge`);
  if (!response.ok) throw new Error("Failed to fetch knowledge files");
  const data = await response.json();
  return data.files;
}

export async function fetchKnowledgeFile(
  name: string,
): Promise<{ name: string; content: string }> {
  const response = await fetch(
    `${API_BASE_URL}/research/knowledge/${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch knowledge file");
  return response.json();
}

export async function fetchResearchSessions(): Promise<ResearchSession[]> {
  const response = await fetch(`${API_BASE_URL}/research/sessions`);
  if (!response.ok) throw new Error("Failed to fetch research sessions");
  const data = await response.json();
  return data.sessions;
}

export async function fetchResearchSession(
  sessionId: string,
): Promise<ResearchSession> {
  const response = await fetch(
    `${API_BASE_URL}/research/sessions/${encodeURIComponent(sessionId)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch research session");
  return response.json();
}

export async function streamResearch(
  request: ResearchRequest,
  onChunk: (chunk: ResearchStreamChunk) => void,
  signal?: AbortSignal,
  useAgent: boolean = false,
): Promise<void> {
  const url = useAgent
    ? `${API_BASE_URL}/research/stream?agent=true`
    : `${API_BASE_URL}/research/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Research stream failed");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;

        try {
          const chunk: ResearchStreamChunk = JSON.parse(data);
          onChunk(chunk);
          if (chunk.type === "done") return;
        } catch {
          console.error("Failed to parse chunk:", data);
        }
      }
    }
  }
}

// ===== Filesystem API =====

export async function fetchFileList(
  dirPath: string = ".",
): Promise<{ path: string; files: FileInfo[] }> {
  const response = await fetch(
    `${API_BASE_URL}/filesystem/list?path=${encodeURIComponent(dirPath)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch file list");
  return response.json();
}

export async function fetchFileContent(filePath: string): Promise<FileContent> {
  const response = await fetch(
    `${API_BASE_URL}/filesystem/content?path=${encodeURIComponent(filePath)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch file content");
  return response.json();
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/filesystem/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, content }),
  });
  if (!response.ok) throw new Error("Failed to write file");
}

export async function deleteFile(filePath: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/filesystem/delete?path=${encodeURIComponent(filePath)}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) throw new Error("Failed to delete file");
}

export async function createDirectory(dirPath: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/filesystem/mkdir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: dirPath }),
  });
  if (!response.ok) throw new Error("Failed to create directory");
}

// ===== Search API (using deepagents backend) =====

export interface GrepMatch {
  path: string;
  line: number;
  text: string;
}

export async function searchFiles(
  pattern: string,
  options: {
    path?: string;
    glob?: string;
    target?: "workspace" | "knowledge";
  } = {},
): Promise<{ pattern: string; matches: GrepMatch[] }> {
  const params = new URLSearchParams();
  params.append("pattern", pattern);
  if (options.path) params.append("path", options.path);
  if (options.glob) params.append("glob", options.glob);
  if (options.target) params.append("target", options.target);

  const response = await fetch(
    `${API_BASE_URL}/filesystem/grep?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to search files");
  return response.json();
}

export async function globFiles(
  pattern: string,
  options: {
    path?: string;
    target?: "workspace" | "knowledge";
  } = {},
): Promise<{ pattern: string; files: FileInfo[] }> {
  const params = new URLSearchParams();
  params.append("pattern", pattern);
  if (options.path) params.append("path", options.path);
  if (options.target) params.append("target", options.target);

  const response = await fetch(
    `${API_BASE_URL}/filesystem/glob?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Failed to glob files");
  return response.json();
}

// ===== Memory API =====

export async function fetchMemory(): Promise<MemoryData> {
  const response = await fetch(`${API_BASE_URL}/memory`);
  if (!response.ok) throw new Error("Failed to fetch memory");
  return response.json();
}

export async function updateMemory(content: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Failed to update memory");
}

// ===== Skills API =====

export async function fetchSkills(): Promise<SkillInfo[]> {
  const response = await fetch(`${API_BASE_URL}/skills`);
  if (!response.ok) throw new Error("Failed to fetch skills");
  const data = await response.json();
  return data.skills;
}

export async function fetchSkill(name: string): Promise<{
  name: string;
  description: string;
  path: string;
  content: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/skills/${encodeURIComponent(name)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch skill");
  return response.json();
}

export async function createSkill(
  name: string,
  description: string,
  content: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, content }),
  });
  if (!response.ok) throw new Error("Failed to create skill");
}

export async function updateSkill(
  name: string,
  description: string,
  content: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/skills/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, content }),
    },
  );
  if (!response.ok) throw new Error("Failed to update skill");
}

export async function deleteSkill(name: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/skills/${encodeURIComponent(name)}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) throw new Error("Failed to delete skill");
}
