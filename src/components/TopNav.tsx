import React from 'react';
import { BookOpen, Flame, Volume2, VolumeX } from 'lucide-react';

export type NavTab = 'roadmap' | 'phonetics' | 'ioe' | 'atlas' | 'mistakes';

interface TopNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onQuickPractice: () => void;
  mistakeCount: number;
  xp: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onQuickPractice,
  mistakeCount,
  xp,
  soundEnabled,
  onToggleSound,
}) => {
  const navItems: { id: NavTab; label: string; count?: number }[] = [
    { id: 'roadmap', label: '12 Unit' },
    { id: 'phonetics', label: 'Ngữ âm & Trọng âm' },
    { id: 'ioe', label: 'Đấu trường IOE' },
    { id: 'atlas', label: 'Ngữ pháp & Luyện dạng' },
    { id: 'mistakes', label: 'Câu sai', count: mistakeCount },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (single line) */}
        <button
          type="button"
          onClick={() => onSelectTab('roadmap')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-lg"
        >
          <span className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:bg-sky-700 transition-colors">
            <BookOpen className="w-5 h-5" />
          </span>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900">
            English 6 <span className="text-sky-600">Studio</span>
          </span>
        </button>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isActive
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="ml-1.5 font-mono-code text-xs font-semibold text-rose-600 tabular-nums">
                    ({item.count})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Sound toggle + Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-700 mr-1 whitespace-nowrap">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-mono-code font-semibold tabular-nums">{xp}</span>
            <span className="text-slate-500 text-xs">XP</span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh phản hồi' : 'Bật âm thanh phản hồi'}
            aria-label={soundEnabled ? 'Tắt âm thanh phản hồi' : 'Bật âm thanh phản hồi'}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onQuickPractice}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600"
          >
            Luyện tập ngay
          </button>
        </div>
      </div>

      {/* Mobile horizontal nav row */}
      <div className="md:hidden border-t border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 rounded-lg transition-colors ${
                  isActive ? 'text-sky-700 bg-sky-50' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
                {typeof item.count === 'number' && item.count > 0 ? ` (${item.count})` : ''}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
