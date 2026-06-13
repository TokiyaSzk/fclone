import React from 'react';
import MemoInput from '../components/MemoInput';
import MemoCard from '../components/MemoCard';
import { useStore } from '../store/useStore';

const Workbench: React.FC = () => {
  const memos = useStore(state => state.memos);

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <MemoInput />
        
        <div className="mt-8 space-y-2">
          {memos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>还没有记录任何想法，开始你的第一条笔记吧！</p>
            </div>
          ) : (
            memos.map(memo => (
              <MemoCard key={memo.id} memo={memo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Workbench;
