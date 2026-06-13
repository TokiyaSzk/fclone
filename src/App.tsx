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
import { useStore } from './store/useStore';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        useStore.getState().fetchData();
      }
    });

    // 监听 auth 状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        useStore.getState().fetchData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => {}} />;
  }

  return (
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
  );
}

export default App;
