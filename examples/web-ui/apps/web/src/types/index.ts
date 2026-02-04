export * from '@deepagents/shared'

export type NavItem = {
  title: string
  href: string
  icon: string
  description?: string
}

export type TabType = 'research' | 'filesystem' | 'memory' | 'skills'
