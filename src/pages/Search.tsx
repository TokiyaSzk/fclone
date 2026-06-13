import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Sparkles, Loader2, Save, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import MemoCard from '../components/MemoCard';
import { callAI } from '../utils/ai';

const Search: React.FC = () => {
  const memos = useStore(state => state.memos);
  const addMemo = useStore(state => state.addMemo);
  const aiConfig = useStore(state => state.aiConfig);
  const [query, setQuery] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveAnswer = () => {
    if (!aiAnswer) return;
    addMemo(`**搜索问题：${query}**\n\n${aiAnswer}\n\n#AI问答`, ['AI问答']);
    setIsSaved(true);
  };

  // 基础搜索过滤
  const filteredMemos = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return memos.filter(m => 
      m.content.toLowerCase().includes(lowerQuery) || 
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }, [memos, query]);

  const handleAISearch = async () => {
    if (!query.trim()) return;
    setIsAISearching(true);
    setAiAnswer(null);
    setIsSaved(false);
    try {
      // 构建一个简单的 RAG (检索增强生成)
      // 我们把相关的或最近的笔记发给 AI
      const recentMemos = memos.slice(0, 50).map(m => `- ${m.content}`).join('\n');
      const prompt = `你是一个有用的个人知识库助手。用户的问题是：“${query}”。\n\n请根据以下用户的近期笔记内容进行回答，如果笔记中没有相关信息，请明确指出。\n\n【用户笔记】\n${recentMemos}`;
      
      const result = await callAI([{ role: 'user', content: prompt }], aiConfig);
      setAiAnswer(result);
    } catch (err: any) {
      alert(err.message || 'AI 搜索失败');
    } finally {
      setIsAISearching(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <SearchIcon className="w-6 h-6 mr-2 text-brand-500" />
            搜索
          </h1>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-gray-700 shadow-sm"
            placeholder="搜索笔记内容或标签..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
          />
          <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <button
            onClick={handleAISearch}
            disabled={!query.trim() || isAISearching}
            className="absolute right-2 top-2 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors disabled:opacity-50 flex items-center"
          >
            {isAISearching ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            AI 问答
          </button>
        </div>

        {aiAnswer && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-brand-700 flex items-center">
                <Sparkles className="w-4 h-4 mr-1" /> AI 搜索结果
              </h3>
              <button 
                onClick={handleSaveAnswer}
                disabled={isSaved}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white/60 hover:bg-white text-brand-600 rounded-md text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaved ? '已保存' : '保存为笔记'}</span>
              </button>
            </div>
            <div className="text-brand-900 leading-relaxed whitespace-pre-wrap text-sm mt-3">
              {aiAnswer}
            </div>
          </div>
        )}

        {query.trim() && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              基础搜索结果 ({filteredMemos.length})
            </h3>
            {filteredMemos.map(memo => (
              <MemoCard key={memo.id} memo={memo} />
            ))}
          </div>
        )}
        
        {!query.trim() && !aiAnswer && (
          <div className="text-center py-20 text-gray-400">
            <SearchIcon className="w-12 h-12 mx-auto text-gray-200 mb-4" />
            <p>输入关键词进行搜索或向 AI 提问</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
