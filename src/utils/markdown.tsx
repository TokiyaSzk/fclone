import React from 'react';

/**
 * 简易 Markdown 渲染器，支持：
 * - **粗体** → <strong>
 * - *斜体* → <em>
 * - `行内代码` → <code>
 * - ```代码块``` → <pre><code>
 * - 列表 (- / * / 1.)
 * - > 引用
 */
export function renderMarkdown(text: string): React.ReactNode[] {
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
          {quoteLines.map((ql, qi) => <p key={qi}>{renderInline(ql)}</p>)}
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
            <li key={li} className="text-gray-700 dark:text-gray-300">{renderInline(item)}</li>
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
            <li key={li} className="text-gray-700 dark:text-gray-300">{renderInline(item)}</li>
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
      <p key={elements.length} className="my-1">{renderInline(line)}</p>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  // 匹配 **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
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
    return <span key={i}>{part}</span>;
  });
}
