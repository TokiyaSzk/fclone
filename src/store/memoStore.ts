import { create } from 'zustand';
import { Memo, MemoRow, rowToMemo } from '../types';
import { supabase } from '../lib/supabase';

// ---- localStorage helpers ----
const MEMOS_KEY = 'fclone_memos';

function saveLocal(memos: Memo[]) {
  try {
    localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
  } catch { /* quota exceeded */ }
}

function loadLocal(): Memo[] | null {
  try {
    const raw = localStorage.getItem(MEMOS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface MemoState {
  memos: Memo[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected';

  fetchData: () => Promise<void>;
  addMemo: (content: string, tags: string[], id?: string) => Promise<void>;
  updateMemo: (id: string, content: string, tags: string[]) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  deleteMemos: (ids: string[]) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  getAllTags: () => string[];
  exportMemos: () => string;
  importMemos: (json: string) => Promise<number>;
  syncToSupabase: () => Promise<{ synced: number; failed: number }>;
  checkConnection: () => Promise<void>;
}

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: [],
  isLoading: false,
  connectionStatus: 'connected',

  checkConnection: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ connectionStatus: session ? 'connected' : 'disconnected' });
    } catch {
      set({ connectionStatus: 'disconnected' });
    }
  },

  fetchData: async () => {
    set({ isLoading: true });

    // 先从 localStorage 加载
    const local = loadLocal();
    if (local) set({ memos: local });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isLoading: false, connectionStatus: 'disconnected' });
        return;
      }

      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data !== null && data !== undefined) {
        const parsed = (data as MemoRow[]).map(rowToMemo);
        // 合并本地仅有但远端不存在的笔记，确保本地新增不丢失
        const localOnly = local ? local.filter(m => !parsed.some(p => p.id === m.id)) : [];
        const merged = [...parsed, ...localOnly].sort((a, b) => b.createdAt - a.createdAt);
        set({ memos: merged, connectionStatus: 'connected' });
        saveLocal(merged);
      }
    } catch (error) {
      console.error('Error fetching memos:', error);
      set({ connectionStatus: 'disconnected' });
    } finally {
      set({ isLoading: false });
    }
  },

  syncToSupabase: async () => {
    const memos = get().memos;
    if (memos.length === 0) return { synced: 0, failed: 0 };

    let session;
    try {
      const result = await supabase.auth.getSession();
      session = result.data.session;
    } catch {
      set({ connectionStatus: 'disconnected' });
      throw new Error('无法连接到 Supabase，请检查配置。');
    }
    if (!session) {
      set({ connectionStatus: 'disconnected' });
      throw new Error('未登录，请先登录后再同步。');
    }

    set({ connectionStatus: 'connected' });
    let synced = 0;
    let failed = 0;

    for (const memo of memos) {
      try {
        const { error } = await supabase.from('memos').upsert({
          id: memo.id,
          content: memo.content,
          tags: memo.tags,
          pinned: memo.pinned,
          user_id: session.user.id,
          created_at: new Date(memo.createdAt).toISOString(),
          updated_at: new Date(memo.updatedAt).toISOString(),
        }, { onConflict: 'id' });
        if (error) throw error;
        synced++;
      } catch (e) {
        console.error('Sync failed for memo:', memo.id, e);
        failed++;
      }
    }

    return { synced, failed };
  },

  addMemo: async (content, tags, _id?: string) => {
    const id = _id || crypto.randomUUID();
    const now = Date.now();
    const newMemo: Memo = { id, content, tags, pinned: false, createdAt: now, updatedAt: now };

    set((s) => {
      const updated = [newMemo, ...s.memos];
      saveLocal(updated);
      return { memos: updated };
    });

    // 先检查 session – 如果 Supabase 不可用，标记断开但保留本地笔记
    let session;
    try {
      const result = await supabase.auth.getSession();
      session = result.data.session;
    } catch {
      set({ connectionStatus: 'disconnected' });
      return;
    }
    if (!session) {
      set({ connectionStatus: 'disconnected' });
      return;
    }

    try {
      const { error } = await supabase.from('memos').insert([{
        id, content, tags, pinned: false,
        user_id: session.user.id,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      }]);
      if (error) throw error;
      set({ connectionStatus: 'connected' });
    } catch (error) {
      // 云端同步失败 — 笔记保留在本地，不触发回滚
      // 用户可通过横幅的「同步到云端」按钮稍后重试
      console.error('Error syncing memo to cloud:', error);
      set({ connectionStatus: 'disconnected' });
    }
  },

  updateMemo: async (id, content, tags) => {
    const now = Date.now();
    set((s) => {
      const updated = s.memos.map(m => m.id === id ? { ...m, content, tags, updatedAt: now } : m);
      saveLocal(updated);
      return { memos: updated };
    });

    try {
      const { error } = await supabase
        .from('memos')
        .update({ content, tags, updated_at: new Date(now).toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating memo:', error);
    }
  },

  deleteMemo: async (id) => {
    const prev = get().memos;
    set((s) => {
      const updated = s.memos.filter(m => m.id !== id);
      saveLocal(updated);
      return { memos: updated };
    });

    try {
      const { error } = await supabase.from('memos').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting memo:', error);
      set({ memos: prev });
      saveLocal(prev);
    }
  },

  deleteMemos: async (ids) => {
    const prev = get().memos;
    set((s) => {
      const idSet = new Set(ids);
      const updated = s.memos.filter(m => !idSet.has(m.id));
      saveLocal(updated);
      return { memos: updated };
    });

    try {
      const { error } = await supabase.from('memos').delete().in('id', ids);
      if (error) throw error;
    } catch (error) {
      console.error('Error batch deleting memos:', error);
      set({ memos: prev });
      saveLocal(prev);
    }
  },

  togglePin: async (id) => {
    const memo = get().memos.find(m => m.id === id);
    if (!memo) return;
    const next = !memo.pinned;

    set((s) => {
      const updated = s.memos.map(m => m.id === id ? { ...m, pinned: next } : m);
      saveLocal(updated);
      return { memos: updated };
    });

    try {
      const { error } = await supabase
        .from('memos')
        .update({ pinned: next, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error toggling pin:', error);
      set((s) => {
        const updated = s.memos.map(m => m.id === id ? { ...m, pinned: !next } : m);
        saveLocal(updated);
        return { memos: updated };
      });
    }
  },

  getAllTags: () => {
    const tagsSet = new Set<string>();
    get().memos.forEach(m => m.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  },

  exportMemos: () => {
    const data = get().memos.map(m => ({
      content: m.content, tags: m.tags, pinned: m.pinned,
      createdAt: m.createdAt, updatedAt: m.updatedAt,
    }));
    return JSON.stringify(data, null, 2);
  },

  importMemos: async (json) => {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) throw new Error('无效的导入格式');

    let count = 0;
    for (const item of data) {
      if (!item.content) continue;
      // 保留原始 ID，确保 [[link]] 跨笔记引用不断裂
      await get().addMemo(item.content, item.tags || [], item.id);
      if (item.pinned) {
        const memo = get().memos.find(m => m.id === item.id);
        if (memo && !memo.pinned) await get().togglePin(memo.id);
      }
      count++;
    }
    return count;
  },
}));
