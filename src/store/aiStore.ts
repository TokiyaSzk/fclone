import { create } from 'zustand';
import { AIConfig } from '../types';
import { supabase } from '../lib/supabase';

const AI_CONFIG_KEY = 'fclone_ai_config';

function saveLocal(config: AIConfig) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch { /* quota exceeded */ }
}

function loadLocal(): AIConfig | null {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AiState {
  aiConfig: AIConfig;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<AIConfig>) => Promise<void>;
}

const DEFAULT_CONFIG: AIConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
};

export const useAiStore = create<AiState>()((set, get) => ({
  aiConfig: loadLocal() ?? DEFAULT_CONFIG,
  isLoading: false,

  fetchConfig: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 未登录时使用本地缓存
        const local = loadLocal();
        if (local) set({ aiConfig: local });
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_config')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      if (data?.ai_config) {
        set({ aiConfig: data.ai_config });
        saveLocal(data.ai_config);
      }
    } catch (error) {
      console.error('Error fetching AI config:', error);
      // 云端拉取失败时回退到本地缓存
      const local = loadLocal();
      if (local) set({ aiConfig: local });
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async (config) => {
    const newConfig = { ...get().aiConfig, ...config };
    set({ aiConfig: newConfig });

    // 始终保存到本地
    saveLocal(newConfig);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          ai_config: newConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      // 云端同步失败 — 配置已保存到本地，下次登录会自动同步
      console.error('Error syncing AI config to cloud:', error);
    }
  },
}));
