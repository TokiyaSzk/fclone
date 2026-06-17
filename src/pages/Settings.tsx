import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Save, Key, Globe, Cpu, LogOut, Sun, Moon, FileDown, FileUp, Database, ExternalLink } from 'lucide-react';
import { useMemoStore } from '../store';
import { useAiStore } from '../store';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../components/Toast';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const aiConfig = useAiStore(state => state.aiConfig);
  const updateConfig = useAiStore(state => state.updateConfig);
  const isLoading = useAiStore(state => state.isLoading);
  const exportMemos = useMemoStore(state => state.exportMemos);
  const importMemos = useMemoStore(state => state.importMemos);
  
  const { theme, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState(aiConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当从云端拉取到最新配置时，更新本地表单状态
  useEffect(() => {
    setFormData(aiConfig);
  }, [aiConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateConfig(formData);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    toast('设置已保存', 'success');
  };

  const handleExport = () => {
    const json = exportMemos();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fclone-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('导出成功', 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importMemos(text);
      setImportCount(count);
      setTimeout(() => setImportCount(null), 3000);
      toast(`成功导入 ${count} 条笔记`, 'success');
    } catch (err: any) {
      toast(err.message || '导入失败', 'error');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Cpu className="w-5 h-5 animate-pulse" />
          正在从云端同步配置...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-8">
          <SettingsIcon className="w-6 h-6 mr-2 text-brand-500" />
          AI 设置
        </h1>

        {/* Theme Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">主题设置</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">切换亮色/暗色模式</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Export / Import */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">数据导入导出</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">备份或迁移你的笔记数据</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FileDown className="w-4 h-4" />
              导出笔记
            </button>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                导入笔记
              </label>
            </div>
          </div>
          {importCount !== null && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              成功导入 {importCount} 条笔记
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">自定义 API 配置</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              配置兼容 OpenAI 格式的 API 接口，实现笔记润色、标签提取和灵感总结。数据仅保存在本地。
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Globe className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                Base URL
              </label>
              <input
                type="text"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Key className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Cpu className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                模型名称 (Model)
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="gpt-3.5-turbo"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                您的 API Key 将被加密安全地存储在云端数据库中。
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  isSaved
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-sm disabled:opacity-50'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? '正在保存...' : isSaved ? '已保存到云端' : '保存设置'}
              </button>
            </div>
          </div>
        </div>

        {/* 账户设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              账户设置
            </h3>
          </div>
          <div className="p-6">
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              退出登录
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">退出登录后需要重新输入账号密码才能访问您的笔记。</p>
          </div>
        </div>

        {/* Supabase 配置指引 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Supabase 云同步配置
            </h3>
          </div>
          <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>当前应用使用 Supabase 作为云端数据库。要开启云同步功能，请在项目根目录创建 <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> 文件并填入以下内容：</p>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-xs">
              <div className="text-gray-400 dark:text-gray-500 mb-1"># .env</div>
              <div className="text-gray-800 dark:text-gray-200">VITE_SUPABASE_URL=<span className="text-brand-500">https://your-project.supabase.co</span></div>
              <div className="text-gray-800 dark:text-gray-200">VITE_SUPABASE_ANON_KEY=<span className="text-brand-500">your-anon-key</span></div>
            </div>

            <ol className="list-decimal list-inside space-y-2">
              <li>
                前往{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline inline-flex items-center gap-1">
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
                {' '}注册并创建一个新项目。
              </li>
              <li>在项目 Settings → API 页面中找到 <strong>Project URL</strong>（即 VITE_SUPABASE_URL）和 <strong>anon public key</strong>（即 VITE_SUPABASE_ANON_KEY）。</li>
              <li>在 Supabase SQL Editor 中运行以下建表语句：</li>
            </ol>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre className="text-gray-800 dark:text-gray-200">{`CREATE TABLE memos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  ai_config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memos"
  ON memos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);`}</pre>
            </div>

            <p>配置完成后重启开发服务器，新建的笔记将自动同步到云端。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
