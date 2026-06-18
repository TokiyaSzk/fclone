import React, { useMemo, useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, X, CloudOff, RefreshCw, Loader2, Settings as SettingsIcon, Hash, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MemoInput from '../components/MemoInput';
import MemoCard from '../components/MemoCard';
import { useMemoStore } from '../store';
import { useUiStore } from '../store';
import { useToast } from '../components/Toast';

const Workbench: React.FC = () => {
  const navigate = useNavigate();
  const memos = useMemoStore(state => state.memos);
  const deleteMemos = useMemoStore(state => state.deleteMemos);
  const connectionStatus = useMemoStore(state => state.connectionStatus);
  const syncToSupabase = useMemoStore(state => state.syncToSupabase);
  const checkConnection = useMemoStore(state => state.checkConnection);
  const activeTagFilter = useUiStore(state => state.activeTagFilter);
  const selectedMemoIds = useUiStore(state => state.selectedMemoIds);
  const clearSelection = useUiStore(state => state.clearSelection);
  const selectAllMemos = useUiStore(state => state.selectAllMemos);
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // 页面挂载时检查一次连接状态
  useEffect(() => {
    checkConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    await deleteMemos(Array.from(selectedMemoIds));
    toast(`已删除 ${selectedCount} 条笔记`, 'success');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncToSupabase();
      if (result.failed > 0) {
        toast(`已同步 ${result.synced} 条，${result.failed} 条失败`, 'error');
      } else {
        toast(`已全部同步到云端 (${result.synced} 条)`, 'success');
      }
    } catch (err: any) {
      toast(err.message || '同步失败', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        {/* 连接状态横幅 */}
        {connectionStatus === 'disconnected' && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm">
            <CloudOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1 text-amber-800 dark:text-amber-200">
              <span className="font-medium">本地模式</span>
              {' — '}笔记保存在本地浏览器中。配置
              <button onClick={() => navigate('/settings')} className="mx-1 underline hover:text-amber-600 dark:hover:text-amber-300">Supabase</button>
              后可将数据同步到云端。
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-800/40 hover:bg-amber-200 dark:hover:bg-amber-700/40 text-amber-700 dark:text-amber-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? '同步中...' : '同步到云端'}
            </button>
          </div>
        )}

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
            activeTagFilter ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Hash className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">没有 #<span className="text-brand-500">{activeTagFilter}</span> 标签的笔记</p>
                <p className="text-sm">试试其他标签，或去掉筛选查看全部笔记</p>
              </div>
            ) : memos.length > 0 ? null : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-[28px] bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-brand-300 dark:text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">开始记录吧</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm text-center leading-relaxed">
                  在上方输入框中写下你的想法，使用 <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Ctrl+Enter</kbd> 快速保存。<br />
                  支持 <span className="text-brand-500">#标签</span> 和 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">[[引用]]</code> 功能。
                </p>
              </div>
            )
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
