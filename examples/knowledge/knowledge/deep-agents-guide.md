# Deep Agents 使用指南

## 概述

Deep Agents 是一个用于构建可控 AI Agent 的 TypeScript 库，基于 LangGraph 构建。它实现了"深度研究"、"Manus"和"Claude Code"等应用的核心模式。

## 四大核心组件

### 1. 规划工具（Planning Tool）

Agent 使用 `write_todos` 工具来：
- 分解复杂任务为可管理的步骤
- 跟踪任务进度
- 根据新信息调整计划

### 2. 子 Agent（Sub Agents）

通过 `task` 工具派生子 Agent：
- 上下文隔离
- 专业化处理
- 并行执行

### 3. 文件系统（File System）

内置文件操作工具：
- `ls` - 列出目录
- `read_file` - 读取文件
- `write_file` - 写入文件
- `edit_file` - 编辑文件
- `glob` - 文件匹配
- `grep` - 文本搜索

### 4. 详细提示词（Detailed Prompt）

基于 Claude Code 的系统提示词，包含：
- 工具使用说明
- 最佳实践
- 工作流程指导

## 快速开始

```typescript
import { createDeepAgent } from "deepagents";

const agent = createDeepAgent({
  systemPrompt: "你是一个专业的研究助手",
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "研究一下 LangGraph" }],
});
```

## 自定义工具

```typescript
import { tool } from "langchain";
import { z } from "zod";

const myTool = tool(
  async ({ input }) => {
    return `处理结果: ${input}`;
  },
  {
    name: "my_tool",
    description: "我的自定义工具",
    schema: z.object({
      input: z.string(),
    }),
  },
);

const agent = createDeepAgent({
  tools: [myTool],
});
```

## 子 Agent 配置

```typescript
import { type SubAgent } from "deepagents";

const researchSubAgent: SubAgent = {
  name: "research-agent",
  description: "用于深入研究",
  systemPrompt: "你是一个专业的研究员...",
  tools: [searchTool],
};

const agent = createDeepAgent({
  subagents: [researchSubAgent],
});
```

## 后端类型

### StateBackend（默认）
内存存储，临时使用：
```typescript
const agent = createDeepAgent({});
```

### FilesystemBackend
文件系统存储：
```typescript
import { FilesystemBackend } from "deepagents";

const agent = createDeepAgent({
  backend: (config) => new FilesystemBackend({ rootDir: "./workspace" }),
});
```

### StoreBackend
持久化存储：
```typescript
import { StoreBackend } from "deepagents";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";

const agent = createDeepAgent({
  backend: (config) => new StoreBackend(config),
  store: new InMemoryStore(),
});
```

## 最佳实践

1. **始终提供自定义系统提示词** - 针对具体用例定制
2. **使用子 Agent 进行上下文隔离** - 避免主 Agent 上下文污染
3. **合理规划任务** - 利用 write_todos 工具
4. **选择合适的后端** - 根据持久化需求选择

## 参考资料

- GitHub：https://github.com/langchain-ai/deepagentsjs
- 文档：https://docs.langchain.com/oss/javascript/deepagents/overview
