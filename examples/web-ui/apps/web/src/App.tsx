import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { ResearchPage } from '@/pages/ResearchPage'
import { FilesystemPage } from '@/pages/FilesystemPage'
import { MemoryPage } from '@/pages/MemoryPage'
import { SkillsPage } from '@/pages/SkillsPage'

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/research/:sessionId" element={<ResearchPage />} />
        <Route path="/filesystem" element={<FilesystemPage />} />
        <Route path="/filesystem/*" element={<FilesystemPage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/skills" element={<SkillsPage />} />
      </Routes>
    </MainLayout>
  )
}

export default App
