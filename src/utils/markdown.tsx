import React from 'react';
import { Link as LinkIcon } from 'lucide-react';

interface MarkdownOptions {
  memos?: { id: string; content: string }[];
  onLinkClick?: (id: string) => void;
}

/**
 * 简易 Markdown 渲染器，支持：
 * - **粗体** → <strong>
 * - *斜体* → <em>
 * - `行内代码` → <code>
 * - ```代码块``` → <pre><code>
 * - 列表 (- / * / 1.)
 * - > 引用
 * - #标签 → 带样式标签
 * - [[id]] → 引用链接
 */
export function renderMarkdown(text: string, options?: MarkdownOptions): React.ReactNode[] {
  const memos = options?.memos || [];
  const onLinkClick = options?.onLinkClick || (() => {});
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // 引用
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-brand-300 dark:border-brand-700 pl-4 my-2 text-gray-600 dark:text-gray-400 italic">
          {quoteLines.map((ql, qi) => <p key={qi}>{renderInline(ql, options)}</p>)}
        </blockquote>
      );
      continue;
    }

    // 无序列表
    if (/^\s*[-*]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside my-2 space-y-1 text-sm">
          {listItems.map((item, li) => (
            <li key={li} className="text-gray-700 dark:text-gray-300">{renderInline(item, options)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 有序列表
    if (/^\s*\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside my-2 space-y-1 text-sm">
          {listItems.map((item, li) => (
            <li key={li} className="text-gray-700 dark:text-gray-300">{renderInline(item, options)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // 普通段落
    elements.push(
      <p key={elements.length} className="my-1">{renderInline(line, options)}</p>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string, options?: MarkdownOptions): React.ReactNode[] {
  const memos = options?.memos || [];
  const onLinkClick = options?.onLinkClick || (() => {});
  // 统一匹配：**bold**, *italic*, `code`, #tag, [[link]]
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|#[^\s#,，、]+|\[\[[a-zA-Z0-9-]+\]\])/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    // #标签
    if (part.startsWith('#')) {
      return <span key={i} className="text-brand-500 font-medium cursor-pointer hover:underline">{part}</span>;
    }
    // [[link]] 引用
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const id = part.slice(2, -2);
      const linkedMemo = memos.find(m => m.id === id);
      if (linkedMemo) {
        const preview = linkedMemo.content.slice(0, 15).replace(/\n/g, ' ') + '...';
        return (
          <span 
            key={i} 
            onClick={() => onLinkClick(id)}
            className="inline-flex items-center text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-1.5 py-0.5 rounded text-sm cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/30 mx-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            {preview}
          </span>
        );
      }
      return <span key={i} className="text-gray-400 dark:text-gray-500 line-through mx-1">[已删除引用]</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
