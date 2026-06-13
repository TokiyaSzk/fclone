import { AIConfig } from '../types';

export const callAI = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  config: AIConfig
): Promise<string> => {
  if (!config.apiKey) {
    throw new Error('API Key 尚未配置，请前往设置页配置。');
  }

  // 移除 baseUrl 结尾的 /
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `AI API 请求失败，状态码：${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const extractTagsWithAI = async (content: string, config: AIConfig): Promise<string[]> => {
  const prompt = `请从以下文本中提取1到3个核心标签。
只返回标签文本，多个标签用逗号分隔，不要包含'#'符号。
如果没有合适的标签，请返回"无标签"。
文本: "${content}"`;

  const result = await callAI([{ role: 'user', content: prompt }], config);
  return result.split(',').map(t => t.trim()).filter(t => t && t !== '无标签');
};

export const polishTextWithAI = async (content: string, config: AIConfig): Promise<string> => {
  const prompt = `请润色并优化以下文本。使其更加简洁清晰，保留原意。直接返回润色后的文本，不要包含任何对话性的废话或解释。
文本: "${content}"`;

  return await callAI([{ role: 'user', content: prompt }], config);
};
