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
  togglePin: (id: string) => Promise<void>;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<void>;
  getAllTags: () => string[];
  fetchData: () => Promise<void>;
  exportMemos: () => string;
  importMemos: (json: string) => Promise<number>;
}

// ---- localStorage helpers ----
const MEMOS_KEY = 'fclone_memos';

function saveMemosToLocal(memos: Memo[]) {
  try {
    localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
  } catch { /* quota exceeded, ignore */ }
}

function loadMemosFromLocal(): Memo[] | null {
  try {
    const raw = localStorage.getItem(MEMOS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

      // 先从 localStorage 加载，保证离线可用
      const localMemos = loadMemosFromLocal();
      if (localMemos) {
        set({ memos: localMemos, isLoadingMemos: false });
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          set({ isLoadingMemos: false, isLoadingConfig: false });
          return;
        }

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
          const parsed = memosRes.data.map((item: any) => ({
            id: item.id,
            content: item.content,
            tags: item.tags || [],
            pinned: item.pinned || false,
            createdAt: new Date(item.created_at).getTime(),
            updatedAt: new Date(item.updated_at).getTime(),
          }));
          set({ memos: parsed });
          saveMemosToLocal(parsed);
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
      const newMemo: Memo = { id, content, tags, pinned: false, createdAt: now, updatedAt: now };

      // 乐观更新 UI
      set((state) => {
        const updated = [newMemo, ...state.memos];
        saveMemosToLocal(updated);
        return { memos: updated };
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase.from('memos').insert([{
          id,
          content,
          tags,
          pinned: false,
          user_id: session.user.id,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        }]);
        if (error) throw error;
      } catch (error) {
        console.error('Error adding memo:', error);
        // 回滚乐观更新
        set((state) => {
          const updated = state.memos.filter(m => m.id !== id);
          saveMemosToLocal(updated);
          return { memos: updated };
        });
      }
    },

    updateMemo: async (id, content, tags) => {
      const now = Date.now();
      // 乐观更新 UI
      set((state) => {
        const updated = state.memos.map((memo) =>
          memo.id === id ? { ...memo, content, tags, updatedAt: now } : memo
        );
        saveMemosToLocal(updated);
        return { memos: updated };
      });

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
      }
    },

    deleteMemo: async (id) => {
      // 乐观更新 UI
      const previousMemos = get().memos;
      set((state) => {
        const updated = state.memos.filter((memo) => memo.id !== id);
        saveMemosToLocal(updated);
        return { memos: updated };
      });

      try {
        const { error } = await supabase.from('memos').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting memo:', error);
        // 回滚乐观更新
        set({ memos: previousMemos });
        saveMemosToLocal(previousMemos);
      }
    },

    togglePin: async (id) => {
      const memo = get().memos.find(m => m.id === id);
      if (!memo) return;
      const newPinned = !memo.pinned;

      // 乐观更新
      set((state) => {
        const updated = state.memos.map(m =>
          m.id === id ? { ...m, pinned: newPinned } : m
        );
        saveMemosToLocal(updated);
        return { memos: updated };
      });

      try {
        const { error } = await supabase
          .from('memos')
          .update({ pinned: newPinned, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error toggling pin:', error);
        // 回滚
        set((state) => {
          const updated = state.memos.map(m =>
            m.id === id ? { ...m, pinned: !newPinned } : m
          );
          saveMemosToLocal(updated);
          return { memos: updated };
        });
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

    // ---- 导出/导入 ----
    exportMemos: () => {
      const { memos } = get();
      const data = memos.map(m => ({
        content: m.content,
        tags: m.tags,
        pinned: m.pinned,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
      return JSON.stringify(data, null, 2);
    },

    importMemos: async (json) => {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) throw new Error('无效的导入格式');
      
      let count = 0;
      for (const item of data) {
        if (!item.content) continue;
        await get().addMemo(
          item.content,
          item.tags || []
        );
        // 如果原数据有 pinned 标记，设置它
        if (item.pinned) {
          const memos = get().memos;
          const latest = memos[0]; // addMemo 总是插入到最前面
          if (latest) {
            await get().togglePin(latest.id);
          }
        }
        count++;
      }
      return count;
    },
  })
);
