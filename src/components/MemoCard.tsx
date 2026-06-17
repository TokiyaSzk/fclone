import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Copy, Edit2, Check, X, Sparkles, Pin } from 'lucide-react';
import { Memo } from '../types';
import { useMemoStore, useUiStore } from '../store';
import { extractTagsFromText } from '../utils/tags';
import { renderMarkdown } from '../utils/markdown';
import clsx from 'clsx';

interface MemoCardProps {
  memo: Memo;
}

const MemoCard: React.FC<MemoCardProps> = ({ memo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(memo.content);
  const [showMenu, setShowMenu] = useState(false);

  const memos = useMemoStore(state => state.memos);
  const updateMemo = useMemoStore(state => state.updateMemo);
  const deleteMemo = useMemoStore(state => state.deleteMemo);
  const togglePin = useMemoStore(state => state.togglePin);
  const selectedMemoIds = useUiStore(state => state.selectedMemoIds);
  const toggleMemoSelect = useUiStore(state => state.toggleMemoSelect);

  const isSelected = selectedMemoIds.has(memo.id);
  const hasSelection = selectedMemoIds.size > 0;

  // 发现相关笔记：有共同标签的其他笔记（最多推荐 3 条）
  const relatedMemos = useMemo(() => {
    if (memo.tags.length === 0) return [];
    return memos
      .filter(m => m.id !== memo.id && m.tags.some(tag => memo.tags.includes(tag)))
      .slice(0, 3);
  }, [memos, memo.tags, memo.id]);

  const handleSave = () => {
    if (!editContent.trim()) return;
    updateMemo(memo.id, editContent, extractTagsFromText(editContent));
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(memo.content);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条笔记吗？')) {
      deleteMemo(memo.id);
    }
    setShowMenu(false);
  };

  const scrollToMemo = (id: string) => {
    const el = document.getElementById(`memo-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-brand-50');
      setTimeout(() => el.classList.remove('bg-brand-50'), 2000);
    }
  };

  /**
   * Render content with integrated markdown + tag + link support.
   * renderMarkdown handles **bold**, *italic*, `code`, code blocks, lists, quotes,
   * AND #tags / [[links]] in a single pass.
   */
  const renderContent = (text: string): React.ReactNode[] => {
    return renderMarkdown(text, {
      memos,
      onLinkClick: scrollToMemo,
    });
  };

  return (
    <div
      id={`memo-${memo.id}`}
      className={clsx(
        "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4 group hover:shadow-md transition-all duration-500",
        memo.pinned && "border-l-2 border-l-brand-500",
        isSelected && "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800"
      )}
    >
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[100px] resize-none outline-none text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 leading-relaxed"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 mr-1" /> 取消
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center px-3 py-1.5 rounded-md text-sm text-white bg-brand-500 hover:bg-brand-600 transition-colors"
            >
              <Check className="w-4 h-4 mr-1" /> 保存
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            {/* Batch selection checkbox */}
            {(hasSelection || !isEditing) && (
              <div className={clsx(
                "flex-shrink-0 mt-0.5 transition-opacity",
                hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMemoSelect(memo.id)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {renderContent(memo.content)}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 relative">
            <span>{format(memo.createdAt, 'yyyy-MM-dd HH:mm')}</span>
            
            <div className="flex items-center space-x-1">
              {/* Pin button */}
              <button 
                onClick={() => togglePin(memo.id)}
                className={clsx(
                  "p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100",
                  memo.pinned
                    ? "text-brand-500 hover:text-brand-600 opacity-100"
                    : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                )}
                title={memo.pinned ? "取消置顶" : "置顶"}
              >
                <Pin className={clsx("w-4 h-4", memo.pinned && "fill-brand-500")} />
              </button>

              {/* Menu button */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-10">
                      <button 
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center text-sm"
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> 编辑
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center text-sm"
                      >
                        <Copy className="w-4 h-4 mr-2" /> 复制
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> 删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 发现相关笔记 */}
          {relatedMemos.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center text-xs text-brand-500 mb-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                发现相关笔记
              </div>
              <div className="space-y-2">
                {relatedMemos.map(rm => (
                  <div 
                    key={rm.id} 
                    onClick={() => scrollToMemo(rm.id)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-lg transition-colors truncate"
                  >
                    {rm.content.replace(/\n/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(MemoCard);
