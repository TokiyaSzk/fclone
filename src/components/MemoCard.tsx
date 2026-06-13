import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Copy, Edit2, Check, X } from 'lucide-react';
import { Memo } from '../types';
import { useStore } from '../store/useStore';
import { extractTagsFromText } from '../utils/tags';

interface MemoCardProps {
  memo: Memo;
}

const MemoCard: React.FC<MemoCardProps> = ({ memo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(memo.content);
  const [showMenu, setShowMenu] = useState(false);
  
  const updateMemo = useStore(state => state.updateMemo);
  const deleteMemo = useStore(state => state.deleteMemo);

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

  const renderContent = (text: string) => {
    const parts = text.split(/(#[^\s#]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return <span key={i} className="text-brand-500 font-medium cursor-pointer hover:underline">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 group hover:shadow-md transition-shadow">
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[100px] resize-none outline-none text-gray-800 bg-gray-50 rounded-lg p-3 leading-relaxed"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {renderContent(memo.content)}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 relative">
            <span>{format(memo.createdAt, 'yyyy-MM-dd HH:mm')}</span>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                    <button 
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center text-sm"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> 编辑
                    </button>
                    <button 
                      onClick={handleCopy}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center text-sm"
                    >
                      <Copy className="w-4 h-4 mr-2" /> 复制
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> 删除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MemoCard;
