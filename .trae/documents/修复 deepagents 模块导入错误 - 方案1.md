## 方案1：将 deepagents 添加到 Web UI 的 workspace

### 修改文件

1. **修改 `web-ui/pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - '../../../libs/deepagents'  # 添加 deepagents 到 workspace
```

2. **修改 `web-ui/apps/server/package.json`**
```json
// 从
"deepagents": "file:../../../../libs/deepagents"

// 改为
"deepagents": "workspace:*"
```

### 执行步骤

```bash
# 1. 先构建 deepagents
cd /Users/linxueyu/studio/deepagentsjs/libs/deepagents
pnpm build

# 2. 重新安装 Web UI 依赖
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. 启动服务
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui
pnpm dev
```

### 预期结果
- pnpm 会将 deepagents 作为 workspace 包链接
- server 可以通过 `workspace:*` 正确导入 deepagents
- 服务正常启动