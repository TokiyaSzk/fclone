import React, { useState, useEffect } from 'react';
import { Shuffle, Sparkles, Loader2, Save, Check } from 'lucide-react';
import { useMemoStore } from '../store';
import { useAiStore } from '../store';
import MemoCard from '../components/MemoCard';
import { callAI } from '../utils/ai';
import { Memo } from '../types';
import { useToast } from '../components/Toast';

const Review: React.FC = () => {
  const { toast } = useToast();
  const memos = useMemoStore(state => state.memos);
  const addMemo = useMemoStore(state => state.addMemo);
  const aiConfig = useAiStore(state => state.aiConfig);
  const [randomMemos, setRandomMemos] = useState<Memo[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const shuffleMemos = () => {
    if (memos.length === 0) return;
    const shuffled = [...memos].sort(() => 0.5 - Math.random());
    setRandomMemos(shuffled.slice(0, Math.min(3, memos.length)));
    setSummary(null);
    setIsSaved(false);
  };

  const handleSaveSummary = () => {
    if (!summary) return;
    addMemo(`${summary}\n\n#AI洞察`, ['AI洞察']);
    setIsSaved(true);
    toast('已保存为笔记', 'success');
  };

  useEffect(() => {
    shuffleMemos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAISummary = async () => {
    if (randomMemos.length === 0) return;
    setIsSummarizing(true);
    try {
      const textToSummarize = randomMemos.map(m => m.content).join('\n\n---\n\n');
      const prompt = `请帮我回顾并总结以下几条笔记，找出它们之间的潜在联系或核心思想，并用简短的话给出启发：\n\n${textToSummarize}`;
      const result = await callAI([{ role: 'user', content: prompt }], aiConfig);
      setSummary(result);
    } catch (err: any) {
      toast(err.message || 'AI 总结失败', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <Shuffle className="w-6 h-6 mr-2 text-brand-500" />
            每日回顾
          </h1>
          <button 
            onClick={shuffleMemos}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center"
          >
            <Shuffle className="w-4 h-4 mr-2" /> 换一批
          </button>
        </div>

        {memos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <p>还没有笔记，去工作台写点什么吧！</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={handleAISummary}
                disabled={isSummarizing}
                className="w-full py-3 border-2 border-dashed border-brand-200 dark:border-brand-800 rounded-xl text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isSummarizing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {isSummarizing ? 'AI 正在碰撞灵感...' : '让 AI 总结这些碎片'}
              </button>
            </div>

            {summary && (
              <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-5 mb-8 relative group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-brand-700 dark:text-brand-300 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" /> AI 洞察
                  </h3>
                  <button 
                    onClick={handleSaveSummary}
                    disabled={isSaved}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 text-brand-600 dark:text-brand-400 rounded-md text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? '已保存' : '保存为笔记'}</span>
                  </button>
                </div>
                <div className="text-brand-900 dark:text-brand-200 leading-relaxed whitespace-pre-wrap text-sm mt-3">
                  {summary}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {randomMemos.map(memo => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Review;
