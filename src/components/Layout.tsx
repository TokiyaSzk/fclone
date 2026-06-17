import React, { useState, useMemo } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Shuffle, Settings, Menu, X, Search as SearchIcon, Map as MapIcon, Hash, FileText } from 'lucide-react';
import { isToday } from 'date-fns';
import clsx from 'clsx';
import { useStore } from '../store/useStore';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const memos = useStore(state => state.memos);
  const activeTagFilter = useStore(state => state.activeTagFilter);
  const setTagFilter = useStore(state => state.setTagFilter);

  const tags = useMemo(() => {
    const tagsSet = new Set<string>();
    memos.forEach(memo => memo.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [memos]);

  const totalMemos = memos.length;
  const totalTags = tags.length;
  const todayMemos = useMemo(() => memos.filter(m => isToday(m.createdAt)).length, [memos]);

  const navItems = [
    { to: '/', icon: BookOpen, label: '全部笔记' },
    { to: '/search', icon: SearchIcon, label: '搜索 / AI 问答' },
    { to: '/review', icon: Shuffle, label: '每日回顾' },
    { to: '/map', icon: MapIcon, label: '认知地图' },
    { to: '/settings', icon: Settings, label: 'AI 设置' },
  ];

  const handleTagClick = (tag: string) => {
    if (activeTagFilter === tag) {
      setTagFilter(null); // toggle off
    } else {
      setTagFilter(tag);
    }
    setIsMobileMenuOpen(false);
  };

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

          {/* Stats section */}
          <div className="mt-6 px-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">统计</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FileText className="w-4 h-4 text-brand-500 mb-1" />
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{totalMemos}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">笔记</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Hash className="w-4 h-4 text-brand-500 mb-1" />
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{totalTags}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">标签</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <BookOpen className="w-4 h-4 text-brand-500 mb-1" />
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{todayMemos}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">今日</span>
              </div>
            </div>
          </div>

          {/* Tag tree */}
          <div className="mt-6 px-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">标签树</h3>
            <div className="space-y-1">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">暂无标签</p>
              ) : (
                tags.map(tag => (
                  <div
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={clsx(
                      "flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                      activeTagFilter === tag
                        ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <span className={clsx(
                      "text-gray-400",
                      activeTagFilter === tag && "text-brand-500 dark:text-brand-400"
                    )}>#</span>
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
