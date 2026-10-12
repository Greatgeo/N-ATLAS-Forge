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
import { ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen bg-[#101827] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#1D4ED8]/30 selection:text-[#38BDF8]">
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
      <footer className="border-t border-[#334155]/60 bg-[#0B1120] py-6 text-xs text-[#94A3B8] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-bold text-[#F8FAFC] font-mono tracking-tight">
              N-ATLAS FORGE
            </div>
            <span className="text-[#334155]" aria-hidden="true">|</span>
            <span className="text-[#CBD5E1]">National AI Innovation Challenge 2026 — PS1 Developer Infrastructure</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#94A3B8]">Target: NCAIR1/N-ATLaS</span>
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#38BDF8] text-[#CBD5E1] transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] rounded"
            >
              Model Card
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
            </a>
            <span className="text-[#475569]">v1.0.0-naic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
