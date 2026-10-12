import React from 'react';
import {
  Terminal,
  Activity,
  Code2,
  Stethoscope,
  ArrowRight,
  ExternalLink,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';
import { NAtlasHealth, EvaluationReport, EvaluationRunResult } from '../../../packages/shared/types.ts';
import { NavTab } from '../Navbar.tsx';
import { Button, Card, MetricCard, Badge } from '../ui/index.ts';

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
  const isDegraded = health?.status === 'degraded';

  const badgeTone = isConnected
    ? 'connected'
    : isMock
    ? 'mock'
    : isDegraded
    ? 'degraded'
    : 'disconnected';

  const statusLabel = isConnected
    ? 'CONNECTED'
    : isMock
    ? 'DEVELOPMENT MOCK'
    : isDegraded
    ? 'DEGRADED'
    : 'DISCONNECTED';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Workspace Overview */}
      <div className="relative overflow-hidden rounded-2xl border border-[#334155] bg-gradient-to-br from-[#101827] via-[#172235] to-[#1E293B] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1D4ED8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
              <span className="text-[#38BDF8] font-semibold">NAIC 2026 PS1</span>
              <span aria-hidden="true" className="text-[#334155]">·</span>
              <span className="text-[#CBD5E1]">Developer Infrastructure Track</span>
              <span aria-hidden="true" className="text-[#334155]">·</span>
              <span className="text-[#F8FAFC]">NCAIR1/N-ATLaS Foundation Model</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Sovereign AI Engineering Workbench
            </h1>
            <p className="text-[#CBD5E1] text-sm leading-relaxed">
              Accelerate developer integration with <span className="text-[#38BDF8] font-semibold font-mono">NCAIR1/N-ATLaS</span>.
              A unified environment to test autoregressive token generation, evaluate socio-legal context under Nigerian statutes, diagnose integration failures, and deploy with the sovereign JavaScript SDK.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="gradient"
                size="md"
                onClick={() => onNavigate('playground')}
                leftIcon={<Terminal className="w-4 h-4" />}
              >
                Launch Playground
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('evaluation')}
                leftIcon={<Activity className="w-4 h-4 text-[#38BDF8]" />}
              >
                Run Benchmark Lab
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('doctor')}
                leftIcon={<Stethoscope className="w-4 h-4 text-[#22C55E]" />}
              >
                Integration Doctor
              </Button>
            </div>
          </div>

          {/* Quick Runtime Telemetry Card */}
          <div className="w-full lg:w-80 rounded-xl border border-[#334155] bg-[#172235]/90 p-4 space-y-3 shrink-0 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#334155] pb-2.5">
              <span className="text-xs font-mono uppercase text-[#CBD5E1] font-semibold">
                Runtime Status
              </span>
              <button
                type="button"
                onClick={onRefreshHealth}
                disabled={healthLoading}
                className="text-[#94A3B8] hover:text-[#38BDF8] transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                title="Ping runtime"
                aria-label="Refresh runtime health"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-[#38BDF8]' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Connection:</span>
                <Badge tone={badgeTone} size="xs">
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Execution Mode:</span>
                <span className="font-mono text-[#F8FAFC] uppercase text-[11px]">
                  {health?.mode === 'local' ? 'Local PyTorch (8B)' : health?.mode === 'api' ? 'Remote Endpoint' : 'Synthetic Mock'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Target Model:</span>
                <span className="font-mono text-[#38BDF8] text-[11px] truncate max-w-[150px]">
                  {health?.modelId || 'NCAIR1/N-ATLaS'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#334155] text-[11px] text-[#CBD5E1] leading-normal">
                {health?.details.message || 'Connecting to backend daemon...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 5 Core Workflow Pillars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[#CBD5E1] font-mono">
            Workbench Pipeline: Connect → Explore → Test → Evaluate → Integrate
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Connect */}
          <Card
            variant="interactive"
            padding="sm"
            onClick={() => onNavigate('settings')}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#1D4ED8]/15 border border-[#1D4ED8]/30 text-[#60A5FA] flex items-center justify-center mb-2.5">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono text-[#60A5FA] font-bold uppercase">Step 1</div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-0.5">
                Connect Runtime
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                Configure PyTorch local daemon or remote endpoints without exposing secrets.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors mt-3 pt-2 border-t border-[#334155]/60 font-mono">
              <span>Settings</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </Card>

          {/* 2. Explore */}
          <Card
            variant="interactive"
            padding="sm"
            onClick={() => onNavigate('api-explorer')}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center mb-2.5">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono text-[#38BDF8] font-bold uppercase">Step 2</div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-0.5">
                Explore APIs
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                Inspect request schemas, curl signatures, and TypeScript SDK integration code.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors mt-3 pt-2 border-t border-[#334155]/60 font-mono">
              <span>API Explorer</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </Card>

          {/* 3. Test */}
          <Card
            variant="interactive"
            padding="sm"
            onClick={() => onNavigate('playground')}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center mb-2.5">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono text-[#22C55E] font-bold uppercase">Step 3</div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-0.5">
                Test Playground
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                Prompt across English, Pidgin, Yoruba, Hausa, and Igbo with live telemetry.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors mt-3 pt-2 border-t border-[#334155]/60 font-mono">
              <span>Playground</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </Card>

          {/* 4. Evaluate */}
          <Card
            variant="interactive"
            padding="sm"
            onClick={() => onNavigate('evaluation')}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Step 4</div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-0.5">
                Evaluate Context
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                4-Axis socio-legal rubric verifying CAMA 2020, VAT acts, and indigenous vernacular.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors mt-3 pt-2 border-t border-[#334155]/60 font-mono">
              <span>Evaluation Lab</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </Card>

          {/* 5. Integrate */}
          <Card
            variant="interactive"
            padding="sm"
            onClick={() => onNavigate('doctor')}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-2.5">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">Step 5</div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors mt-0.5">
                Integrate & Heal
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                Deterministic troubleshooting for CUDA memory, gated HF tokens, and timeouts.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors mt-3 pt-2 border-t border-[#334155]/60 font-mono">
              <span>Doctor</span>
              <ArrowRight className="w-3 h-3 ml-auto" />
            </div>
          </Card>
        </div>
      </div>

      {/* Dual Section: Empirical Evaluation Summary & Official Model Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empirical Evaluation Summary */}
        <Card variant="standard" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-[#F8FAFC] font-mono uppercase tracking-wider">
                Empirical Evaluation Status
              </h3>
            </div>
            {evaluationRuns.length > 0 && (
              <Badge tone="connected" size="xs">
                {evaluationRuns.length} Test Runs
              </Badge>
            )}
          </div>

          {evaluationRuns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#334155] p-6 text-center space-y-3 bg-[#101827]/40">
              <div className="text-xs font-mono font-semibold text-[#CBD5E1] uppercase tracking-wider">
                NOT YET EVALUATED
              </div>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                Benchmark scores require execution against the 4-axis socio-legal evaluation suite. No tests have been recorded in this session.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('evaluation')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#38BDF8]" />}
              >
                Open Evaluation Lab
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Average Score"
                  value={evaluationReport?.averageScore !== undefined ? evaluationReport.averageScore.toFixed(1) : '—'}
                  unit="/ 5.0"
                  tone="cyan"
                />
                <MetricCard
                  label="Cases Passed"
                  value={evaluationReport ? `${evaluationReport.passedCases}/${evaluationReport.totalCases}` : '—'}
                  tone="green"
                />
                <MetricCard
                  label="Avg Latency"
                  value={evaluationReport?.averageLatencyMs !== undefined ? evaluationReport.averageLatencyMs : '—'}
                  unit="ms"
                  tone="blue"
                />
              </div>

              {/* Recent runs preview */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-[#CBD5E1] font-mono">Recent Test Executions:</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {evaluationRuns.slice(0, 3).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#101827]/80 border border-[#334155] text-xs"
                    >
                      <div className="truncate max-w-[240px] flex items-center gap-2">
                        <span className="font-mono text-[#38BDF8] text-[11px] shrink-0">[{run.caseId}]</span>
                        <span className="text-[#F8FAFC] truncate">{run.prompt}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-[11px] font-bold tabular-nums ${
                            run.status === 'passed'
                              ? 'text-[#22C55E]'
                              : run.status === 'warning'
                              ? 'text-[#F59E0B]'
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
                  type="button"
                  onClick={() => onNavigate('evaluation')}
                  className="text-xs text-[#38BDF8] hover:text-[#7DD3FC] inline-flex items-center gap-1 font-mono focus-visible:outline-none focus-visible:underline"
                >
                  <span>View comprehensive evaluation report & export</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Model Card Reference Details */}
        <Card variant="standard" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-bold text-[#F8FAFC] font-mono uppercase tracking-wider">
                Official Model Profile (NCAIR1/N-ATLaS)
              </h3>
            </div>
            <a
              href="https://huggingface.co/NCAIR1/N-ATLaS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#CBD5E1] hover:text-[#38BDF8] inline-flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
            >
              <span>Hugging Face Hub</span>
              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#101827]/80 border border-[#334155]">
              <div className="text-[#94A3B8] text-[10px] font-mono">ORGANIZATION</div>
              <div className="text-[#F8FAFC] font-semibold mt-0.5">NCAIR / FMCIDE Nigeria</div>
            </div>
            <div className="p-3 rounded-lg bg-[#101827]/80 border border-[#334155]">
              <div className="text-[#94A3B8] text-[10px] font-mono">BASE ARCHITECTURE</div>
              <div className="text-[#F8FAFC] font-semibold mt-0.5">Llama-3-8B-Instruct Base</div>
            </div>
            <div className="p-3 rounded-lg bg-[#101827]/80 border border-[#334155]">
              <div className="text-[#94A3B8] text-[10px] font-mono">PRECISION & SIZING</div>
              <div className="text-[#F8FAFC] font-semibold mt-0.5">8 Billion Params (bfloat16)</div>
            </div>
            <div className="p-3 rounded-lg bg-[#101827]/80 border border-[#334155]">
              <div className="text-[#94A3B8] text-[10px] font-mono">CONTEXT WINDOW</div>
              <div className="text-[#F8FAFC] font-semibold mt-0.5">8,192 Tokens</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-[#CBD5E1] uppercase mb-2">Supported Language Ensembles:</div>
            <div className="flex flex-wrap gap-2 text-xs text-[#CBD5E1]">
              <span className="bg-[#101827] border border-[#334155] px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC]">English (Nigerian Legal Context)</span>
              <span className="bg-[#101827] border border-[#334155] px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC]">Yoruba (Èdè Yorùbá)</span>
              <span className="bg-[#101827] border border-[#334155] px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC]">Hausa (Harshen Hausa)</span>
              <span className="bg-[#101827] border border-[#334155] px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC]">Igbo (Asụsụ Igbo)</span>
              <span className="bg-[#101827] border border-[#334155] px-2.5 py-1 rounded-md text-[11px] text-[#F8FAFC]">Nigerian Pidgin (Naija)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#334155] text-xs text-[#94A3B8] flex items-center justify-between">
            <span>License: Llama 3 Community / Sovereign AI</span>
            <span className="font-mono text-[#38BDF8] text-[11px]">PS1 Developer Infra</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
