import React from 'react';
import {
  Terminal,
  Activity,
  Code2,
  Stethoscope,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';
import { NAtlasHealth, EvaluationReport, EvaluationRunResult } from '../../../packages/shared/types.ts';
import { NavTab } from '../Navbar.tsx';

interface DashboardViewProps {
  health: NAtlasHealth | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  onNavigate: (tab: NavTab) => void;
  evaluationReport: EvaluationReport | null;
  evaluationRuns: EvaluationRunResult[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  health,
  healthLoading,
  onRefreshHealth,
  onNavigate,
  evaluationReport,
  evaluationRuns,
}) => {
  const isConnected = health?.status === 'connected';
  const isMock = health?.status === 'mock_mode' || health?.mode === 'mock';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0c1328] via-[#080d1c] to-[#050814] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              National AI Innovation Challenge 2026 — PS1 Developer Infrastructure
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sovereign AI Engineering Workbench
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Accelerate developer adoption of <span className="text-amber-300 font-semibold font-mono">NCAIR1/N-ATLaS</span>.
              A unified environment to test autoregressive generation, evaluate socio-legal context, diagnose integration failures, and deploy with the sovereign JavaScript SDK.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('playground')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
              >
                <Terminal className="w-4 h-4" />
                Launch Playground
              </button>
              <button
                onClick={() => onNavigate('evaluation')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
              >
                <Activity className="w-4 h-4 text-amber-400" />
                Run Benchmark Lab
              </button>
              <button
                onClick={() => onNavigate('doctor')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
              >
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                Integration Doctor
              </button>
            </div>
          </div>

          {/* Quick Runtime Badge Card */}
          <div className="w-full lg:w-80 rounded-xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 font-medium">Model Status</span>
              <button
                onClick={onRefreshHealth}
                disabled={healthLoading}
                className="text-slate-400 hover:text-amber-300 transition-colors"
                title="Ping runtime"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Connection:</span>
                <span
                  className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                    isConnected
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : isMock
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  }`}
                >
                  {isConnected ? 'CONNECTED' : isMock ? 'DEVELOPMENT MOCK' : 'NOT CONNECTED'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Mode:</span>
                <span className="font-mono text-slate-200 uppercase text-[11px]">
                  {health?.mode === 'local' ? 'Local Model (PyTorch)' : health?.mode === 'api' ? 'Remote API' : 'Synthetic Mock'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Target Model:</span>
                <span className="font-mono text-amber-300 text-[11px] truncate max-w-[150px]">
                  {health?.modelId || 'NCAIR1/N-ATLaS'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-normal">
                {health?.details.message}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 5 Core Workflow Pillars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
            Workbench Pipeline: Connect → Explore → Test → Evaluate → Integrate
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Connect */}
          <div
            onClick={() => onNavigate('settings')}
            className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">Step 1</div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Connect Runtime
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Configure PyTorch local worker or official remote endpoints without exposing secrets.
            </p>
          </div>

          {/* 2. Explore */}
          <div
            onClick={() => onNavigate('api-explorer')}
            className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Step 2</div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Explore APIs
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Inspect request schemas, curl signatures, and TypeScript SDK integration code.
            </p>
          </div>

          {/* 3. Test */}
          <div
            onClick={() => onNavigate('playground')}
            className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Step 3</div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Test Playground
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Generate responses across English, Pidgin, Yoruba, Hausa, and Igbo with live telemetry.
            </p>
          </div>

          {/* 4. Evaluate */}
          <div
            onClick={() => onNavigate('evaluation')}
            className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">Step 4</div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Evaluate Context
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              4-Axis socio-legal rubric verifying CAMA 2020, VAT acts, and indigenous vernacular.
            </p>
          </div>

          {/* 5. Integrate */}
          <div
            onClick={() => onNavigate('doctor')}
            className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Step 5</div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Integrate & Heal
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Deterministic troubleshooting for CUDA memory, gated HF tokens, and proxy timeouts.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Section: Empirical Evaluation Summary (Rule 5) & Model Card Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empirical Evaluation Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Empirical Evaluation Status
              </h3>
            </div>
            {evaluationRuns.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {evaluationRuns.length} Test Runs Recorded
              </span>
            )}
          </div>

          {evaluationRuns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center space-y-3">
              <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                NOT YET EVALUATED
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Per Rule 5 (No Fabricated Evaluation Results), all benchmark scores must originate from actual execution runs. No evaluations have been run in this session yet.
              </p>
              <button
                onClick={() => onNavigate('evaluation')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
              >
                Open Evaluation Lab to run benchmarks
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Overall Average</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {evaluationReport?.averageScore ?? '—'} <span className="text-xs text-slate-500">/ 5.0</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Passed Cases</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {evaluationReport?.passedCases} / {evaluationReport?.totalCases}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Avg Latency</div>
                  <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                    {evaluationReport?.averageLatencyMs} <span className="text-xs text-slate-500">ms</span>
                  </div>
                </div>
              </div>

              {/* Recent runs preview */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-400 font-mono">Recent Test Runs:</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {evaluationRuns.slice(0, 3).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs"
                    >
                      <div className="truncate max-w-[240px]">
                        <span className="font-mono text-slate-400 text-[11px] mr-2">[{run.caseId}]</span>
                        <span className="text-slate-200">{run.prompt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            run.status === 'passed'
                              ? 'text-emerald-400'
                              : run.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {run.aggregateScore.toFixed(1)}/5.0
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onNavigate('evaluation')}
                  className="text-xs text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 font-mono"
                >
                  View complete evaluation report & export
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Model Card Reference Details */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Official Model Profile (NCAIR1/N-ATLaS)
              </h3>
            </div>
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              Hugging Face Hub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <div className="text-slate-400 text-[10px] font-mono">ORGANIZATION</div>
              <div className="text-slate-200 font-semibold mt-0.5">NCAIR / FMCIDE Nigeria</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <div className="text-slate-400 text-[10px] font-mono">BASE ARCHITECTURE</div>
              <div className="text-slate-200 font-semibold mt-0.5">Llama-3-8B-Instruct Base</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <div className="text-slate-400 text-[10px] font-mono">PRECISION & SIZING</div>
              <div className="text-slate-200 font-semibold mt-0.5">8 Billion Params (bfloat16)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <div className="text-slate-400 text-[10px] font-mono">CONTEXT WINDOW</div>
              <div className="text-slate-200 font-semibold mt-0.5">8,192 Tokens</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">Linguistic Coverage:</div>
            <div className="flex flex-wrap gap-1.5">
              {['English (Nigerian Context)', 'Yoruba (Èdè Yorùbá)', 'Hausa (Harshen Hausa)', 'Igbo (Asụsụ Igbo)', 'Nigerian Pidgin'].map(
                (lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]"
                  >
                    {lang}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>License: Llama 3 Community / Sovereign AI</span>
            <span className="font-mono text-amber-400/90 text-[11px]">PS1 Developer Infra</span>
          </div>
        </div>
      </div>
    </div>
  );
};
