import React, { useState, useMemo } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Shuffle, Settings, Menu, X, Search as SearchIcon, Map as MapIcon } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const memos = useStore(state => state.memos);

  const tags = useMemo(() => {
    const tagsSet = new Set<string>();
    memos.forEach(memo => memo.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [memos]);

  const navItems = [
    { to: '/', icon: BookOpen, label: '全部笔记' },
    { to: '/search', icon: SearchIcon, label: '搜索 / AI 问答' },
    { to: '/review', icon: Shuffle, label: '每日回顾' },
    { to: '/map', icon: MapIcon, label: '认知地图' },
    { to: '/settings', icon: Settings, label: 'AI 设置' },
  ];

  return (
    <div className="flex h-screen bg-surface-subtle text-gray-800 dark:text-gray-100 font-sans">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-20">
        <div className="flex items-center space-x-2 text-brand-500 font-bold text-lg">
          <BookOpen className="w-6 h-6" />
          <span>Flomo Clone</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0 pt-14 md:pt-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-brand-500 font-bold text-xl">
            <BookOpen className="w-6 h-6" />
            <span>Flomo Clone</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => clsx(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="mt-8 px-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">标签树</h3>
            <div className="space-y-1">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">暂无标签</p>
              ) : (
                tags.map(tag => (
                  <div
                    key={tag}
                    onClick={() => console.log('Filter by tag:', tag)}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 cursor-pointer transition-colors"
                  >
                    <span className="text-gray-400 dark:text-gray-500">#</span>
                    <span className="truncate">{tag}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col md:pt-0 pt-14">
        <Outlet />
      </main>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
