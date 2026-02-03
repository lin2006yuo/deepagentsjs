# LangGraph 简介

## 什么是 LangGraph

LangGraph 是一个用于构建基于大语言模型（LLM）的有状态、多参与者应用程序的库。它是 LangChain 生态系统的一部分，专门设计用于创建复杂的 Agent 工作流。

## 核心概念

### 1. 图（Graph）结构

LangGraph 使用图结构来定义应用程序的流程：
- **节点（Nodes）**：代表函数或操作
- **边（Edges）**：代表节点之间的连接和流转
- **状态（State）**：在节点之间传递的数据

### 2. 状态管理

LangGraph 提供了强大的状态管理功能：
- 自动状态传递
- 状态持久化（Checkpoints）
- 支持并行执行

### 3. 循环支持

与其他 LLM 框架不同，LangGraph 原生支持循环：
- Agent 可以反复调用工具
- 支持条件分支
- 支持人机交互（Human-in-the-loop）

## 主要特性

| 特性 | 说明 |
|------|------|
| **流式支持** | 实时输出和令牌流 |
| **持久化** | 自动保存和恢复状态 |
| **人机交互** | 支持人工审核和干预 |
| **多 Agent** | 支持多个 Agent 协作 |

## 使用场景

1. **深度研究 Agent** - 自动进行多步骤研究
2. **代码助手** - 理解代码库并执行修改
3. **对话机器人** - 有状态的长期对话
4. **工作流自动化** - 复杂的业务流程

## 简单示例

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class State(TypedDict):
    message: str

graph = StateGraph(State)

def node_a(state):
    return {"message": state["message"] + " from A"}

def node_b(state):
    return {"message": state["message"] + " from B"}

graph.add_node("A", node_a)
graph.add_node("B", node_b)
graph.add_edge("A", "B")
graph.add_edge("B", END)
graph.set_entry_point("A")

app = graph.compile()
result = app.invoke({"message": "Hello"})
print(result)  # {"message": "Hello from A from B"}
```

## 相关资源

- 官方文档：https://langchain-ai.github.io/langgraph/
- GitHub：https://github.com/langchain-ai/langgraph
