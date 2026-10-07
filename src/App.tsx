import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { PlaygroundView } from './components/views/PlaygroundView.tsx';
import { EvaluationView } from './components/views/EvaluationView.tsx';
import { ApiExplorerView } from './components/views/ApiExplorerView.tsx';
import { DoctorView } from './components/views/DoctorView.tsx';
import { DocsView } from './components/views/DocsView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { NAtlasHealth, EvaluationReport, EvaluationRunResult } from '../packages/shared/types.ts';
import { fetchHealth, fetchEvaluations } from './lib/api.ts';
import { ShieldCheck, ExternalLink, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [health, setHealth] = useState<NAtlasHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRunResult[]>([]);

  useEffect(() => {
    refreshHealth();
    refreshEvaluations();

    // Periodic poll for runtime health every 30s
    const timer = setInterval(() => {
      refreshHealth(false);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const refreshHealth = async (showLoading = true) => {
    if (showLoading) setHealthLoading(true);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to ping N-ATLaS health', err);
    } finally {
      if (showLoading) setHealthLoading(false);
    }
  };

  const refreshEvaluations = async () => {
    try {
      const data = await fetchEvaluations();
      setEvaluationReport(data.report);
      setEvaluationRuns(data.runs);
    } catch (err) {
      console.error('Failed to fetch evaluations', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={() => refreshHealth(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            health={health}
            healthLoading={healthLoading}
            onRefreshHealth={() => refreshHealth(true)}
            onNavigate={setActiveTab}
            evaluationReport={evaluationReport}
            evaluationRuns={evaluationRuns}
          />
        )}

        {activeTab === 'playground' && (
          <PlaygroundView health={health} />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationView
            health={health}
            onRunsUpdated={refreshEvaluations}
          />
        )}

        {activeTab === 'api-explorer' && (
          <ApiExplorerView health={health} />
        )}

        {activeTab === 'doctor' && (
          <DoctorView health={health} />
        )}

        {activeTab === 'docs' && (
          <DocsView />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            health={health}
            healthLoading={healthLoading}
            onRefreshHealth={() => refreshHealth(true)}
          />
        )}
      </main>

      {/* Clean Technical Footer */}
      <footer className="border-t border-slate-900 bg-[#04060e] py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              N-ATLAS FORGE
            </div>
            <span className="text-slate-700">|</span>
            <span>National AI Innovation Challenge 2026 — PS1 Developer Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-400">Target: NCAIR1/N-ATLaS</span>
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors inline-flex items-center gap-1"
            >
              Model Card
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">v1.0.0-naic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
