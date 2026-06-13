import React, { useState, useEffect } from 'react';
import { Shuffle, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import MemoCard from '../components/MemoCard';
import { callAI } from '../utils/ai';
import { Memo } from '../types';

const Review: React.FC = () => {
  const memos = useStore(state => state.memos);
  const aiConfig = useStore(state => state.aiConfig);
  const [randomMemos, setRandomMemos] = useState<Memo[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const shuffleMemos = () => {
    if (memos.length === 0) return;
    const shuffled = [...memos].sort(() => 0.5 - Math.random());
    setRandomMemos(shuffled.slice(0, Math.min(3, memos.length)));
    setSummary(null);
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
      alert(err.message || 'AI 总结失败');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Shuffle className="w-6 h-6 mr-2 text-brand-500" />
            每日回顾
          </h1>
          <button 
            onClick={shuffleMemos}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center"
          >
            <Shuffle className="w-4 h-4 mr-2" /> 换一批
          </button>
        </div>

        {memos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p>还没有笔记，去工作台写点什么吧！</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={handleAISummary}
                disabled={isSummarizing}
                className="w-full py-3 border-2 border-dashed border-brand-200 rounded-xl text-brand-600 font-medium hover:bg-brand-50 transition-colors flex items-center justify-center disabled:opacity-50"
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
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-8">
                <h3 className="font-bold text-brand-700 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" /> AI 洞察
                </h3>
                <div className="text-brand-900 leading-relaxed whitespace-pre-wrap text-sm">
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
