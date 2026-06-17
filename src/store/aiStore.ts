import { create } from 'zustand';
import { AIConfig } from '../types';
import { supabase } from '../lib/supabase';

interface AiState {
  aiConfig: AIConfig;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<AIConfig>) => Promise<void>;
}

export const useAiStore = create<AiState>()((set, get) => ({
  aiConfig: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
  },
  isLoading: false,

  fetchConfig: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { set({ isLoading: false }); return; }

      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_config')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      if (data?.ai_config) set({ aiConfig: data.ai_config });
    } catch (error) {
      console.error('Error fetching AI config:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async (config) => {
    const newConfig = { ...get().aiConfig, ...config };
    set({ aiConfig: newConfig });

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
      console.error('Error updating AI config:', error);
    }
  },
}));
