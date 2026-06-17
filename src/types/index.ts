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
