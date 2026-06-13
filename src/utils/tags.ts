export const extractTagsFromText = (text: string): string[] => {
  // 匹配 # 后的非空白字符，直到遇到空格或结尾
  const tagRegex = /#([^\s#]+)/g;
  const matches = [...text.matchAll(tagRegex)];
  return Array.from(new Set(matches.map(m => m[1])));
};

// 高亮文本中的标签
export const highlightTags = (text: string) => {
  // 这是一个简单的工具方法，实际渲染在组件中会更复杂
  return text.replace(/#([^\s#]+)/g, '<span class="text-brand-500 font-medium">#$1</span>');
};
