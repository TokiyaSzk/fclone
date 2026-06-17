import React, { useMemo } from 'react';
import { CheckSquare, Square, Trash2, X } from 'lucide-react';
import MemoInput from '../components/MemoInput';
import MemoCard from '../components/MemoCard';
import { useStore } from '../store/useStore';
import { useToast } from '../components/Toast';

const Workbench: React.FC = () => {
  const memos = useStore(state => state.memos);
  const activeTagFilter = useStore(state => state.activeTagFilter);
  const selectedMemoIds = useStore(state => state.selectedMemoIds);
  const clearSelection = useStore(state => state.clearSelection);
  const selectAllMemos = useStore(state => state.selectAllMemos);
  const deleteSelectedMemos = useStore(state => state.deleteSelectedMemos);
  const { toast } = useToast();

  // Filter memos by active tag
  const filteredMemos = useMemo(() => {
    let result = memos;
    if (activeTagFilter) {
      result = memos.filter(m => m.tags.includes(activeTagFilter));
    }
    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [memos, activeTagFilter]);

  const selectedCount = selectedMemoIds.size;
  const filteredIds = useMemo(() => filteredMemos.map(m => m.id), [filteredMemos]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedMemoIds.has(id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      clearSelection();
    } else {
      selectAllMemos(filteredIds);
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`确定要删除选中的 ${selectedCount} 条笔记吗？`)) return;
    await deleteSelectedMemos();
    toast(`已删除 ${selectedCount} 条笔记`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <MemoInput />

        {/* Tag filter indicator */}
        {activeTagFilter && (
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 rounded-lg">
            <span className="font-medium">筛选标签: #{activeTagFilter}</span>
            <span className="text-gray-400 dark:text-gray-500">({filteredMemos.length} 条)</span>
          </div>
        )}

        {/* Batch action bar */}
        {selectedCount > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              已选择 <span className="text-brand-600 dark:text-brand-400">{selectedCount}</span> 条
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleSelectAll}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {allFilteredSelected ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    全选
                  </>
                )}
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                取消选择
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                批量删除
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-2">
          {filteredMemos.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <p>
                {activeTagFilter
                  ? `没有带有 #${activeTagFilter} 标签的笔记`
                  : '还没有记录任何想法，开始你的第一条笔记吧！'
                }
              </p>
            </div>
          ) : (
            filteredMemos.map(memo => (
              <MemoCard key={memo.id} memo={memo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Workbench;
