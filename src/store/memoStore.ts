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

  fetchData: () => Promise<void>;
  addMemo: (content: string, tags: string[]) => Promise<void>;
  updateMemo: (id: string, content: string, tags: string[]) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  deleteMemos: (ids: string[]) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  getAllTags: () => string[];
  exportMemos: () => string;
  importMemos: (json: string) => Promise<number>;
}

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });

    // 先从 localStorage 加载
    const local = loadLocal();
    if (local) set({ memos: local });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { set({ isLoading: false }); return; }

      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const parsed = (data as MemoRow[]).map(rowToMemo);
        set({ memos: parsed });
        saveLocal(parsed);
      }
    } catch (error) {
      console.error('Error fetching memos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMemo: async (content, tags) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newMemo: Memo = { id, content, tags, pinned: false, createdAt: now, updatedAt: now };

    set((s) => {
      const updated = [newMemo, ...s.memos];
      saveLocal(updated);
      return { memos: updated };
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('memos').insert([{
        id, content, tags, pinned: false,
        user_id: session.user.id,
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('Error adding memo:', error);
      set((s) => {
        const updated = s.memos.filter(m => m.id !== id);
        saveLocal(updated);
        return { memos: updated };
      });
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
      await get().addMemo(item.content, item.tags || []);
      if (item.pinned) {
        const latest = get().memos[0];
        if (latest) await get().togglePin(latest.id);
      }
      count++;
    }
    return count;
  },
}));
