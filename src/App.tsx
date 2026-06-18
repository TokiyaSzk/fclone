import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Workbench from './pages/Workbench';
import Review from './pages/Review';
import Settings from './pages/Settings';
import Search from './pages/Search';
import MapPage from './pages/Map';
import { useMemoStore, useAiStore } from './store';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

/** 全局键盘快捷键监听器 */
function GlobalShortcuts() {
  const navigate = useNavigate();
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K / Cmd+K → 跳转搜索页
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      navigate('/search');
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        useMemoStore.getState().fetchData();
        useAiStore.getState().fetchConfig();
      }
    }).catch((err) => {
      console.error('Session check failed (Supabase may be unconfigured):', err);
      setSession(null);
      setLoading(false);
    });

    // 监听 auth 状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        useMemoStore.getState().fetchData();
        useAiStore.getState().fetchConfig();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-gray-100">Loading...</div>;
  }

  if (!session) {
    return <ToastProvider><Auth onLogin={() => {}} /></ToastProvider>;
  }

  return (
    <ToastProvider>
      <ErrorBoundary>
        <HashRouter>
          <GlobalShortcuts />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Workbench />} />
              <Route path="search" element={<Search />} />
              <Route path="review" element={<Review />} />
              <Route path="map" element={<MapPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
