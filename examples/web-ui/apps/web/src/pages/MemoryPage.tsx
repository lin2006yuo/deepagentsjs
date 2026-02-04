import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Brain, Save, RefreshCw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchMemory, updateMemory } from '@/services/api'
import type { MemoryData } from '@deepagents/shared'
import { formatTimestamp } from '@deepagents/shared'

const DEFAULT_AGENTS_MD = `---
name: deepagents-project
description: DeepAgents Web UI Project Configuration
---

# Project Configuration

## Code Style
- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Use async/await for asynchronous operations

## Build Commands
- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm typecheck\` - Run TypeScript checks

## Architecture
- Frontend: React + Vite + TailwindCSS
- Backend: Express + DeepAgents
- Monorepo structure with pnpm workspaces
`

export function MemoryPage() {
  const [memory, setMemory] = useState<MemoryData | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadMemory = async () => {
    setIsLoading(true)
    try {
      const data = await fetchMemory()
      setMemory(data)
      setContent(data.content || DEFAULT_AGENTS_MD)
    } catch (error) {
      toast.error('加载记忆失败')
      setContent(DEFAULT_AGENTS_MD)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateMemory(content)
      toast.success('记忆保存成功')
      loadMemory()
    } catch (error) {
      toast.error('保存记忆失败')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    loadMemory()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">记忆管理</h1>
          <p className="text-muted-foreground">配置 AGENTS.md 项目记忆</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMemory} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                关于记忆
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AGENTS.md 文件用于存储项目级的持久化记忆。代理在启动时会自动加载此文件的内容，
                从而了解项目的代码风格、架构约定和常用命令。
              </p>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">用途包括:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>代码风格指南</li>
                  <li>构建和部署命令</li>
                  <li>项目架构说明</li>
                  <li>常用 API 和工具</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {memory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">文件信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">来源:</span>
                  <span>{memory.source}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">更新时间:</span>
                  <span>
                    {memory.updatedAt
                      ? formatTimestamp(memory.updatedAt)
                      : '未保存'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">AGENTS.md</CardTitle>
            <CardDescription>编辑项目记忆配置</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                加载中...
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-[500px]"
                placeholder="输入 AGENTS.md 内容..."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
