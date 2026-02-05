## 问题诊断

错误显示无法找到 `deepagents/dist/index.js` 模块。根本原因是：

1. `deepagents` 包使用本地文件路径引用：`file:../../../../libs/deepagents`
2. 该包可能没有被正确构建或链接
3. Web UI 的 node_modules 中没有 deepagents

## 修复步骤

### 步骤 1: 构建 deepagents 包
```bash
cd /Users/linxueyu/studio/deepagentsjs/libs/deepagents
pnpm install
pnpm build
```

### 步骤 2: 重新安装 Web UI 依赖
```bash
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui
rm -rf node_modules
pnpm install
```

### 步骤 3: 验证修复
```bash
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui
pnpm dev
```

## 备选方案

如果步骤 1-2 不奏效，可以修改 `agentResearchService.ts` 使用相对路径导入：

```typescript
// 从
import { createDeepAgent, type SubAgent, FilesystemBackend } from "deepagents";

// 改为
import { createDeepAgent, type SubAgent, FilesystemBackend } from "../../../../../../libs/deepagents/dist/index.js";
```

但这个方案不够优雅，优先尝试重新构建和安装。