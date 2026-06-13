import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Memo, AIConfig } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  memos: Memo[];
  aiConfig: AIConfig;
  isLoadingMemos: boolean;
  addMemo: (content: string, tags: string[]) => Promise<void>;
  updateMemo: (id: string, content: string, tags: string[]) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  getAllTags: () => string[];
  fetchMemos: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      memos: [],
      isLoadingMemos: false,
      aiConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo',
      },
      fetchMemos: async () => {
        set({ isLoadingMemos: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const { data, error } = await supabase
            .from('memos')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          if (data) {
            set({
              memos: data.map((item: any) => ({
                id: item.id,
                content: item.content,
                tags: item.tags || [],
                createdAt: new Date(item.created_at).getTime(),
                updatedAt: new Date(item.updated_at).getTime(),
              })),
            });
          }
        } catch (error) {
          console.error('Error fetching memos:', error);
        } finally {
          set({ isLoadingMemos: false });
        }
      },
      addMemo: async (content, tags) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newMemo = { id, content, tags, createdAt: now, updatedAt: now };
        
        // 乐观更新 UI
        set((state) => ({ memos: [newMemo, ...state.memos] }));
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { error } = await supabase.from('memos').insert([{
            id,
            content,
            tags,
            user_id: session.user.id,
            created_at: new Date(now).toISOString(),
            updated_at: new Date(now).toISOString(),
          }]);
          if (error) throw error;
        } catch (error) {
          console.error('Error adding memo:', error);
          // 回滚乐观更新
          set((state) => ({ memos: state.memos.filter(m => m.id !== id) }));
        }
      },
      updateMemo: async (id, content, tags) => {
        const now = Date.now();
        // 乐观更新 UI
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === id ? { ...memo, content, tags, updatedAt: now } : memo
          ),
        }));
        
        try {
          const { error } = await supabase
            .from('memos')
            .update({
              content,
              tags,
              updated_at: new Date(now).toISOString(),
            })
            .eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('Error updating memo:', error);
          // 这里可以加入更完善的错误处理或重试逻辑
        }
      },
      deleteMemo: async (id) => {
        // 乐观更新 UI
        const previousMemos = get().memos;
        set((state) => ({
          memos: state.memos.filter((memo) => memo.id !== id),
        }));
        
        try {
          const { error } = await supabase.from('memos').delete().eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('Error deleting memo:', error);
          // 回滚乐观更新
          set({ memos: previousMemos });
        }
      },
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
      // 只持久化 aiConfig，memos 由 supabase 管理
      partialize: (state) => ({ aiConfig: state.aiConfig }),
    }
  )
);
