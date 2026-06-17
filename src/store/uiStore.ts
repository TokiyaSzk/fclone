import { create } from 'zustand';

interface UiState {
  activeTagFilter: string | null;
  selectedMemoIds: Set<string>;
  setTagFilter: (tag: string | null) => void;
  toggleMemoSelect: (id: string) => void;
  selectAllMemos: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  activeTagFilter: null,
  selectedMemoIds: new Set<string>(),

  setTagFilter: (tag) => set({ activeTagFilter: tag, selectedMemoIds: new Set() }),

  toggleMemoSelect: (id) => set((s) => {
    const next = new Set(s.selectedMemoIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedMemoIds: next };
  }),

  selectAllMemos: (ids) => set({ selectedMemoIds: new Set(ids) }),

  clearSelection: () => set({ selectedMemoIds: new Set() }),
}));
