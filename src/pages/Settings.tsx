import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, Globe, Cpu, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const aiConfig = useStore(state => state.aiConfig);
  const updateAIConfig = useStore(state => state.updateAIConfig);
  const isLoadingConfig = useStore(state => state.isLoadingConfig);
  
  const [formData, setFormData] = useState(aiConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
    await updateAIConfig(formData);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (isLoadingConfig) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex justify-center items-center h-64">
        <div className="text-gray-500 flex items-center gap-2">
          <Cpu className="w-5 h-5 animate-pulse" />
          正在从云端同步配置...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface-subtle">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center mb-8">
          <SettingsIcon className="w-6 h-6 mr-2 text-brand-500" />
          AI 设置
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">自定义 API 配置</h2>
            <p className="text-sm text-gray-500">
              配置兼容 OpenAI 格式的 API 接口，实现笔记润色、标签提取和灵感总结。数据仅保存在本地。
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Globe className="w-4 h-4 mr-1.5 text-gray-400" />
                Base URL
              </label>
              <input
                type="text"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Key className="w-4 h-4 mr-1.5 text-gray-400" />
                API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Cpu className="w-4 h-4 mr-1.5 text-gray-400" />
                模型名称 (Model)
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="gpt-3.5-turbo"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                您的 API Key 将被加密安全地存储在云端数据库中。
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  isSaved
                    ? 'bg-green-100 text-green-700'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-gray-500" />
              账户设置
            </h3>
          </div>
          <div className="p-6">
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              退出登录
            </button>
            <p className="mt-2 text-sm text-gray-500">退出登录后需要重新输入账号密码才能访问您的笔记。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
