import { create } from 'zustand';
import { Memo, AIConfig } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  memos: Memo[];
  aiConfig: AIConfig;
  isLoadingMemos: boolean;
  isLoadingConfig: boolean;
  addMemo: (content: string, tags: string[]) => Promise<void>;
  updateMemo: (id: string, content: string, tags: string[]) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<void>;
  getAllTags: () => string[];
  fetchData: () => Promise<void>;
}

export const useStore = create<AppState>()(
  (set, get) => ({
    memos: [],
    isLoadingMemos: false,
    isLoadingConfig: false,
    aiConfig: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-3.5-turbo',
    },
    fetchData: async () => {
      set({ isLoadingMemos: true, isLoadingConfig: true });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // 并行拉取 memos 和 config
        const [memosRes, configRes] = await Promise.all([
          supabase
            .from('memos')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('user_settings')
            .select('ai_config')
            .eq('user_id', session.user.id)
            .single()
        ]);
          
        if (memosRes.error) throw memosRes.error;
        
        // 更新 Memos
        if (memosRes.data) {
          set({
            memos: memosRes.data.map((item: any) => ({
              id: item.id,
              content: item.content,
              tags: item.tags || [],
              createdAt: new Date(item.created_at).getTime(),
              updatedAt: new Date(item.updated_at).getTime(),
            })),
          });
        }

        // 更新 AI Config
        if (configRes.data && configRes.data.ai_config) {
          set({ aiConfig: configRes.data.ai_config });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        set({ isLoadingMemos: false, isLoadingConfig: false });
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
      updateAIConfig: async (config) => {
        const newConfig = { ...get().aiConfig, ...config };
        // 乐观更新 UI
        set({ aiConfig: newConfig });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: session.user.id,
              ai_config: newConfig,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            
          if (error) throw error;
        } catch (error) {
          console.error('Error updating AI config:', error);
        }
      },
      getAllTags: () => {
        const tagsSet = new Set<string>();
        get().memos.forEach((memo) => {
          memo.tags.forEach((tag) => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
      },
    })
);
