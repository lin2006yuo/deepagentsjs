import { create } from 'zustand'
import type { ResearchSession, ResearchStreamChunk } from '@deepagents/shared'

interface ResearchState {
  sessions: ResearchSession[]
  currentSession: ResearchSession | null
  isLoading: boolean
  streamChunks: ResearchStreamChunk[]
  abortController: AbortController | null
}

interface ResearchActions {
  setSessions: (sessions: ResearchSession[]) => void
  setCurrentSession: (session: ResearchSession | null) => void
  setIsLoading: (isLoading: boolean) => void
  addStreamChunk: (chunk: ResearchStreamChunk) => void
  clearStreamChunks: () => void
  setAbortController: (controller: AbortController | null) => void
  abortResearch: () => void
}

export const useResearchStore = create<ResearchState & ResearchActions>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  streamChunks: [],
  abortController: null,

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addStreamChunk: (chunk) => set((state) => ({ streamChunks: [...state.streamChunks, chunk] })),
  clearStreamChunks: () => set({ streamChunks: [] }),
  setAbortController: (controller) => set({ abortController: controller }),

  abortResearch: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({ abortController: null, isLoading: false })
    }
  },
}))
