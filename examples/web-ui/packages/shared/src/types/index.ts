// Research types
export interface ResearchRequest {
  question: string;
  sessionId?: string;
  knowledgeBase?: string[];
}

export interface ResearchStreamChunk {
  type: 'thinking' | 'tool_call' | 'subagent' | 'report' | 'todo' | 'progress' | 'done' | 'error' | 'phase';
  content?: string;
  toolName?: string;
  toolData?: unknown;
  subAgentName?: string;
  todo?: { content: string; status: string };
  progress?: number;
  error?: string;
  phase?: string;
  phaseName?: string;
  phaseIcon?: string;
}

export interface ResearchSession {
  id: string;
  question: string;
  status: 'running' | 'completed' | 'error';
  createdAt: number;
  updatedAt: number;
  report?: string;
  todos: Array<{ content: string; status: string }>;
}

// Filesystem types
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
}

// Memory types
export interface MemoryData {
  content: string;
  source: string;
  updatedAt: number;
}

// Skills types
export interface SkillInfo {
  name: string;
  description: string;
  path: string;
}

// Chat types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reasoningContent?: string;
  toolCalls?: Array<{ toolName: string; data: unknown }>;
}

// API Config types
export interface AgentConfig {
  apiKey: string;
  baseURL?: string;
  modelName: string;
  temperature: number;
  enableTools?: boolean;
}
