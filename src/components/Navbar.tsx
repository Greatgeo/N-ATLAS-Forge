import React from 'react';
import {
  Cpu,
  Terminal,
  Activity,
  Code2,
  Stethoscope,
  BookOpen,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { NAtlasHealth } from '../../packages/shared/types.ts';
import { StatusBadge } from './StatusBadge.tsx';

export type NavTab =
  | 'dashboard'
  | 'playground'
  | 'evaluation'
  | 'api-explorer'
  | 'doctor'
  | 'docs'
  | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  health: NAtlasHealth | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Cpu },
    { id: 'playground' as NavTab, label: 'Playground', icon: Terminal },
    { id: 'evaluation' as NavTab, label: 'Evaluation Lab', icon: Activity },
    { id: 'api-explorer' as NavTab, label: 'API & SDK', icon: Code2 },
    { id: 'doctor' as NavTab, label: 'Doctor', icon: Stethoscope },
    { id: 'docs' as NavTab, label: 'Docs', icon: BookOpen },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#101827]/95 backdrop-blur-md border-b border-[#334155]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101827] rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#38BDF8] flex items-center justify-center text-[#F8FAFC] shadow-sm shadow-blue-900/30 group-hover:brightness-110 transition-all">
              <span className="font-mono font-bold text-sm">N</span>
            </div>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap shrink-0">
              <span className="font-bold tracking-tight text-[#F8FAFC] text-base group-hover:text-[#38BDF8] transition-colors">
                N-ATLAS
              </span>
              <span className="font-mono text-xs font-semibold text-[#38BDF8]">
                Forge
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                    isActive
                      ? 'bg-[#1D4ED8] text-[#F8FAFC] font-semibold border border-[#38BDF8]/30 shadow-sm shadow-blue-900/20'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172235]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Model Status & External Link */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StatusBadge health={health} loading={healthLoading} onRefresh={onRefreshHealth} />
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              title="Official Hugging Face Repository (NCAIR1/N-ATLaS)"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#334155] bg-[#172235] text-[#CBD5E1] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 text-xs transition-colors shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <span className="font-mono text-[11px]">N-ATLaS Hub</span>
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-[#334155]/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap shrink-0 min-h-[40px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                  isActive
                    ? 'bg-[#1D4ED8] text-[#F8FAFC] border border-[#38BDF8]/30 font-semibold shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172235]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
