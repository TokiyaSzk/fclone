import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Memo, AIConfig } from '../types';

interface AppState {
  memos: Memo[];
  aiConfig: AIConfig;
  addMemo: (content: string, tags: string[]) => void;
  updateMemo: (id: string, content: string, tags: string[]) => void;
  deleteMemo: (id: string) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  getAllTags: () => string[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      memos: [],
      aiConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo',
      },
      addMemo: (content, tags) => set((state) => ({
        memos: [
          {
            id: crypto.randomUUID(),
            content,
            tags,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...state.memos,
        ],
      })),
      updateMemo: (id, content, tags) => set((state) => ({
        memos: state.memos.map((memo) =>
          memo.id === id
            ? { ...memo, content, tags, updatedAt: Date.now() }
            : memo
        ),
      })),
      deleteMemo: (id) => set((state) => ({
        memos: state.memos.filter((memo) => memo.id !== id),
      })),
      updateAIConfig: (config) => set((state) => ({
        aiConfig: { ...state.aiConfig, ...config },
      })),
      getAllTags: () => {
        const tagsSet = new Set<string>();
        get().memos.forEach((memo) => {
          memo.tags.forEach((tag) => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
      },
    }),
    {
      name: 'flomo-clone-storage',
    }
  )
);
