import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Wrench,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  FileText,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  fetchSkills,
  fetchSkill,
  createSkill,
  updateSkill,
  deleteSkill,
} from '@/services/api'
import type { SkillInfo } from '@deepagents/shared'

export function SkillsPage() {
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [selectedSkill, setSelectedSkill] = useState<SkillInfo | null>(null)
  const [skillContent, setSkillContent] = useState('')
  const [skillDescription, setSkillDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDescription, setNewSkillDescription] = useState('')
  const [newSkillContent, setNewSkillContent] = useState('')

  const loadSkills = async () => {
    setIsLoading(true)
    try {
      const data = await fetchSkills()
      setSkills(data)
    } catch (error) {
      toast.error('加载技能列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSkill = async (skill: SkillInfo) => {
    setIsLoading(true)
    try {
      const data = await fetchSkill(skill.name)
      setSelectedSkill(skill)
      setSkillContent(data.content)
      // Parse description from content
      const descMatch = data.content.match(/description:\s*(.+)/)
      setSkillDescription(descMatch ? descMatch[1].trim() : '')
      setIsEditing(false)
    } catch (error) {
      toast.error('加载技能详情失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSkill = async () => {
    if (!selectedSkill) return

    try {
      await updateSkill(selectedSkill.name, skillDescription, skillContent)
      toast.success('技能保存成功')
      setIsEditing(false)
      loadSkills()
    } catch (error) {
      toast.error('保存技能失败')
    }
  }

  const handleDeleteSkill = async (skill: SkillInfo) => {
    if (!confirm(`确定要删除技能 "${skill.name}" 吗？`)) return

    try {
      await deleteSkill(skill.name)
      toast.success('技能删除成功')
      if (selectedSkill?.name === skill.name) {
        setSelectedSkill(null)
        setSkillContent('')
      }
      loadSkills()
    } catch (error) {
      toast.error('删除技能失败')
    }
  }

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      toast.error('请输入技能名称')
      return
    }

    const defaultContent = `---
name: ${newSkillName}
description: ${newSkillDescription || 'A new skill'}
---

# ${newSkillName}

## When to Use

Describe when this skill should be used.

## Workflow

1. Step one
2. Step two
3. Step three

## Best Practices

- Practice one
- Practice two
`

    try {
      await createSkill(
        newSkillName,
        newSkillDescription || 'A new skill',
        newSkillContent || defaultContent
      )
      toast.success('技能创建成功')
      setShowCreateDialog(false)
      setNewSkillName('')
      setNewSkillDescription('')
      setNewSkillContent('')
      loadSkills()
    } catch (error) {
      toast.error('创建技能失败')
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">技能中心</h1>
          <p className="text-muted-foreground">创建和管理 SKILL.md 技能文档</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSkills} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建技能
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">技能列表</CardTitle>
            <CardDescription>已定义的技能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {skills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  暂无技能
                </p>
              ) : (
                skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedSkill?.name === skill.name
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectSkill(skill)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSkill(skill)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {skill.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skill Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedSkill ? selectedSkill.name : '技能编辑器'}
                </CardTitle>
                <CardDescription>
                  {selectedSkill
                    ? selectedSkill.description
                    : '选择或创建一个技能'}
                </CardDescription>
              </div>
              {selectedSkill && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" onClick={handleSaveSkill}>
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSkill ? (
              <Textarea
                value={skillContent}
                onChange={(e) => setSkillContent(e.target.value)}
                disabled={!isEditing}
                className="font-mono text-sm min-h-[500px]"
                placeholder="SKILL.md 内容..."
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>选择一个技能进行查看或编辑</p>
                <p className="text-sm mt-2">或点击"新建技能"创建新的技能</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Skill Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建技能</DialogTitle>
            <DialogDescription>创建一个新的 SKILL.md 技能</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">技能名称</label>
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="例如: web-research"
              />
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <Input
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                placeholder="技能的简短描述"
              />
            </div>
            <div>
              <label className="text-sm font-medium">内容 (可选)</label>
              <Textarea
                value={newSkillContent}
                onChange={(e) => setNewSkillContent(e.target.value)}
                placeholder="留空将使用默认模板"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateSkill}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
