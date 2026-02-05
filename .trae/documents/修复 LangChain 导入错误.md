## 问题分析

`zod-to-json-schema` 尝试从 `zod` 包导入 `./v3` 子路径，但 pnpm 虚拟存储中的 `zod@3.23.8` 没有正确配置 exports。

## 修复方案

### 方案1：升级 zod 到最新版本（推荐）

在 `web-ui/apps/server/package.json` 中升级 zod：

```json
"zod": "^3.24.0"
```

然后重新安装依赖。

### 方案2：在 server 目录下直接安装 zod

```bash
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui/apps/server
pnpm add zod@^3.24.0
```

### 方案3：清理并重新安装所有依赖

```bash
cd /Users/linxueyu/studio/deepagentsjs/examples/web-ui
rm -rf node_modules apps/server/node_modules pnpm-lock.yaml
pnpm install
```

## 建议执行步骤

1. 先尝试升级 zod 版本
2. 清理 pnpm 缓存并重新安装
3. 验证修复结果

这个错误是由于 pnpm 的依赖解析机制和 zod 版本不兼容导致的。
