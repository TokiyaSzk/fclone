// ---- Supabase DB row types ----
export interface MemoRow {
  id: string;
  content: string;
  tags: string[];
  pinned: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  ai_config: AIConfig;
  updated_at: string;
}

// ---- App types ----
export interface Memo {
  id: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// ---- Helpers ----
export function rowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    content: row.content,
    tags: row.tags || [],
    pinned: row.pinned || false,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}
