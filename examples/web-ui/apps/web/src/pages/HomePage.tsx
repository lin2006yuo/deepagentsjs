import { useNavigate } from 'react-router-dom'
import {
  Search,
  FolderOpen,
  Brain,
  Wrench,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    title: '研究模式',
    description: '基于本地知识库进行深度研究，生成结构化报告',
    icon: Search,
    href: '/research',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: '文件系统',
    description: '管理工作区文件，支持代码生成与编辑',
    icon: FolderOpen,
    href: '/filesystem',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: '记忆管理',
    description: '配置 AGENTS.md，管理项目上下文',
    icon: Brain,
    href: '/memory',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: '技能中心',
    description: '创建和管理 SKILL.md 技能文档',
    icon: Wrench,
    href: '/skills',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>DeepAgents Web UI</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          探索 AI 代理的
          <span className="text-primary"> 无限可能</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          基于 LangGraph 的智能代理系统，支持研究、文件管理、记忆和技能等多种能力
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Button size="lg" onClick={() => navigate('/research')}>
            开始研究
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/filesystem')}>
            浏览文件
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(feature.href)}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {feature.description}
                  </CardDescription>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                点击开始使用 {feature.title}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-muted rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">关于 DeepAgents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div>
            <h3 className="font-medium text-foreground mb-2">研究能力</h3>
            <p>使用本地知识库进行深度研究，支持子代理并行处理，生成详细的研究报告</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">文件操作</h3>
            <p>通过 FilesystemBackend 直接读写文件，支持代码生成和项目文件管理</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">记忆与技能</h3>
            <p>使用 AGENTS.md 管理项目记忆，SKILL.md 定义可复用的代理技能</p>
          </div>
        </div>
      </div>
    </div>
  )
}
