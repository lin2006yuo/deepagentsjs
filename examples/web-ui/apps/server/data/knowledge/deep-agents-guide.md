# Deep Agents 使用指南

Deep Agents 是基于 LangGraph 的高级 AI 代理框架。

## 核心组件

### 1. 代理 (Agent)
代理是执行任务的实体，可以：
- 调用工具
- 与其他代理协作
- 管理记忆

### 2. 技能 (Skills)
技能是可复用的功能模块：
- 文件操作
- 网络搜索
- 代码执行
- 数据分析

### 3. 记忆 (Memory)
支持多种记忆类型：
- **短期记忆**：当前会话上下文
- **长期记忆**：跨会话持久化
- **知识库**：结构化文档存储

## 快速开始

```python
from deep_agents import Agent, Skill

# 创建代理
agent = Agent(
    name="researcher",
    skills=["search", "read_file"]
)

# 执行任务
result = agent.run("研究 LangGraph 的最新特性")
```

## 最佳实践

1. 为代理定义清晰的角色和职责
2. 使用技能组合完成复杂任务
3. 合理设计记忆策略
4. 添加错误处理和重试机制
