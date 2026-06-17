import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [session, setSession] = useState<any>(null);
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
