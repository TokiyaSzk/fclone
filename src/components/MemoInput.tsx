import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Tag as TagIcon, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { extractTagsFromText } from '../utils/tags';
import { polishTextWithAI, extractTagsWithAI } from '../utils/ai';
import clsx from 'clsx';

const MemoInput: React.FC = () => {
  const [content, setContent] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 引用下拉框状态
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [refSearchText, setRefSearchText] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const memos = useStore(state => state.memos);
  const addMemo = useStore(state => state.addMemo);
  const aiConfig = useStore(state => state.aiConfig);

  const filteredMemos = memos.filter(m => 
    m.content.toLowerCase().includes(refSearchText.toLowerCase())
  ).slice(0, 5);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // 简单检测是否刚刚输入了 [[
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/\[\[([^\]]*)$/);
    
    if (match) {
      setRefSearchText(match[1]);
      setShowRefDropdown(true);
      // 简单定位在输入框下方
      setDropdownPos({ top: 40, left: 20 });
    } else {
      setShowRefDropdown(false);
    }
  };

  const handleSelectRef = (id: string) => {
    const cursor = textareaRef.current?.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursor);
    const textAfterCursor = content.slice(cursor);
    
    // 替换掉 [[... 为 [[id]]
    const replacedBefore = textBeforeCursor.replace(/\[\[([^\]]*)$/, `[[${id}]] `);
    
    setContent(replacedBefore + textAfterCursor);
    setShowRefDropdown(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    const tags = extractTagsFromText(content);
    addMemo(content, tags);
    setContent('');
    setError(null);
    setShowRefDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePolish = async () => {
    if (!content.trim()) return;
    setIsPolishing(true);
    setError(null);
    try {
      const polished = await polishTextWithAI(content, aiConfig);
      setContent(polished);
    } catch (err: any) {
      setError(err.message || '润色失败');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleExtractTags = async () => {
    if (!content.trim()) return;
    setIsExtracting(true);
    setError(null);
    try {
      const tags = await extractTagsWithAI(content, aiConfig);
      if (tags.length > 0) {
        const tagsString = tags.map(t => `#${t}`).join(' ');
        setContent(prev => `${prev}\n\n${tagsString}`);
      }
    } catch (err: any) {
      setError(err.message || '提取标签失败');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 transition-shadow focus-within:shadow-md focus-within:border-brand-300 relative">
      <textarea
        ref={textareaRef}
        className="w-full min-h-[120px] resize-none outline-none text-gray-800 placeholder-gray-400 bg-transparent leading-relaxed"
        placeholder="记录一下现在的想法... (Ctrl+Enter 发送, #标签, [[引用)"
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
      />

      {showRefDropdown && (
        <div 
          className="absolute z-10 w-64 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500 font-medium border-b border-gray-100">
            引用笔记
          </div>
          {filteredMemos.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">没有找到相关笔记</div>
          ) : (
            filteredMemos.map(m => (
              <div
                key={m.id}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 cursor-pointer truncate transition-colors"
                onClick={() => handleSelectRef(m.id)}
              >
                {m.content.replace(/\n/g, ' ')}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-3 px-3 py-2 bg-red-50 rounded-md border border-red-100">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <div className="flex space-x-2">
          <button 
            onClick={handlePolish}
            disabled={isPolishing || !content.trim()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="一键润色"
          >
            {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="hidden sm:inline">AI 润色</span>
          </button>
          
          <button 
            onClick={handleExtractTags}
            disabled={isExtracting || !content.trim()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="自动提取标签"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TagIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">智能标签</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {content.length} 字
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={clsx(
              "flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-all",
              content.trim() 
                ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <span>发送</span>
            <Send className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoInput;
