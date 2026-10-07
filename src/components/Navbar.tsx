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
  ShieldCheck,
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
    { id: 'doctor' as NavTab, label: 'Integration Doctor', icon: Stethoscope },
    { id: 'docs' as NavTab, label: 'Docs', icon: BookOpen },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onSelectTab('dashboard')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors">
                <span className="font-mono font-bold text-sm">N</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-white text-base font-sans group-hover:text-amber-300 transition-colors">
                    N-ATLAS <span className="text-amber-400 font-mono text-sm">Forge</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    NAIC 2026 PS1
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Build. Test. Evaluate. Integrate with Nigeria's Sovereign AI.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-amber-300 border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Model Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            <StatusBadge health={health} loading={healthLoading} onRefresh={onRefreshHealth} />
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              title="Official Hugging Face Repository (NCAIR1/N-ATLaS)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-amber-300 hover:border-slate-700 text-xs transition-colors"
            >
              <span className="font-mono text-[11px]">HF Hub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
