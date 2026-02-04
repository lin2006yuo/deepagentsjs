import { NavLink } from 'react-router-dom'
import {
  Home,
  Search,
  FolderOpen,
  Brain,
  Wrench,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: '首页',
    href: '/',
    icon: Home,
    description: '功能概览',
  },
  {
    title: '研究',
    href: '/research',
    icon: Search,
    description: '基于知识库的研究',
  },
  {
    title: '文件系统',
    href: '/filesystem',
    icon: FolderOpen,
    description: '工作区文件管理',
  },
  {
    title: '记忆',
    href: '/memory',
    icon: Brain,
    description: 'AGENTS.md 配置',
  },
  {
    title: '技能',
    href: '/skills',
    icon: Wrench,
    description: 'SKILL.md 管理',
  },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">DeepAgents</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">AI 代理交互平台</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs opacity-70">{item.description}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>基于 LangGraph 构建</p>
          <p className="mt-1">支持多种 AI 能力</p>
        </div>
      </div>
    </aside>
  )
}
