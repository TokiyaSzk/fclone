import React, { useMemo, useState, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useMemoStore } from '../store';
import ForceGraph2D from 'react-force-graph-2d';

const MapPage: React.FC = () => {
  const memos = useMemoStore(state => state.memos);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    
    const tagsSet = new Set<string>();
    
    // Add memo nodes
    memos.forEach(memo => {
      if (memo.tags.length === 0) return; // Only show connected memos
      
      nodes.push({
        id: memo.id,
        name: memo.content.slice(0, 15) + '...',
        val: 1,
        color: '#374151', // gray-700 (dark mode friendly)
        type: 'memo'
      });
      
      memo.tags.forEach(tag => {
        tagsSet.add(tag);
        links.push({
          source: memo.id,
          target: `tag-${tag}`
        });
      });
    });
    
    // Add tag nodes
    tagsSet.forEach(tag => {
      nodes.push({
        id: `tag-${tag}`,
        name: `#${tag}`,
        val: 3,
        color: '#22c55e', // green-500
        type: 'tag'
      });
    });

    return { nodes, links };
  }, [memos]);

  return (
    <div className="h-full flex flex-col bg-surface-subtle dark:bg-gray-900">
      <div className="px-4 py-6 md:py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-2">
          <MapIcon className="w-6 h-6 mr-2 text-brand-500" />
          认知地图
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">可视化你的思维网络。绿点为标签，灰点为笔记。滚动可缩放，拖拽可移动。</p>
      </div>

      <div id="graph-container" className="flex-1 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <p>还没有包含标签的笔记，快去添加吧！</p>
          </div>
        ) : (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6}
            linkColor={() => '#4b5563'} // gray-600 (dark mode friendly)
            linkWidth={1}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = node.type === 'tag' ? 14/globalScale : 10/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

              ctx.fillStyle = 'rgba(31, 41, 55, 0.8)'; // gray-800 background for readability
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.color;
              ctx.fillText(label, node.x, node.y);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
