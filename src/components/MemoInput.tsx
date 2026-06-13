import React, { useState } from 'react';
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
  
  const addMemo = useStore(state => state.addMemo);
  const aiConfig = useStore(state => state.aiConfig);

  const handleSubmit = () => {
    if (!content.trim()) return;
    const tags = extractTagsFromText(content);
    addMemo(content, tags);
    setContent('');
    setError(null);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 transition-shadow focus-within:shadow-md focus-within:border-brand-300">
      <textarea
        className="w-full min-h-[120px] resize-none outline-none text-gray-800 placeholder-gray-400 bg-transparent leading-relaxed"
        placeholder="记录一下现在的想法... (Ctrl+Enter 发送, #标签)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
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
