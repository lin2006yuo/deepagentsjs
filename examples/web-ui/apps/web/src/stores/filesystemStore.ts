import { create } from 'zustand'
import type { FileInfo } from '@deepagents/shared'

interface FilesystemState {
  currentPath: string
  files: FileInfo[]
  selectedFile: FileInfo | null
  fileContent: string
  isLoading: boolean
}

interface FilesystemActions {
  setCurrentPath: (path: string) => void
  setFiles: (files: FileInfo[]) => void
  setSelectedFile: (file: FileInfo | null) => void
  setFileContent: (content: string) => void
  setIsLoading: (isLoading: boolean) => void
  navigateToParent: () => void
}

export const useFilesystemStore = create<FilesystemState & FilesystemActions>((set, get) => ({
  currentPath: '.',
  files: [],
  selectedFile: null,
  fileContent: '',
  isLoading: false,

  setCurrentPath: (path) => set({ currentPath: path }),
  setFiles: (files) => set({ files }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setFileContent: (content) => set({ fileContent: content }),
  setIsLoading: (isLoading) => set({ isLoading }),

  navigateToParent: () => {
    const { currentPath } = get()
    if (currentPath === '.') return

    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parentPath = parts.length === 0 ? '.' : parts.join('/')
    set({ currentPath: parentPath })
  },
}))
